import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import Student from '../../../src/models/Student';
import User from '../../../src/models/User';
import studentRoutes from '../../../src/routes/studentRoutes';

const app = express();
app.use(express.json());
app.use('/api/students', studentRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Helper function to create a test user and get token
const createTestUser = async (role: 'admin' | 'teacher' = 'admin') => {
  const user = await User.create({
    username: `testuser_${Date.now()}`,
    password: 'hashedpassword',
    role
  });
  
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  
  return { user, token };
};

describe('Student Controller', () => {
  describe('POST /api/students', () => {
    it('should create a new student with valid data (Admin)', async () => {
      const { token } = await createTestUser('admin');
      
      const studentData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        age: 20,
        gradeLevel: '12th Grade'
      };

      const response = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .send(studentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Student added successfully');
      expect(response.body.student).toMatchObject({
        name: studentData.name,
        email: studentData.email.toLowerCase(),
        age: studentData.age,
        gradeLevel: studentData.gradeLevel
      });
      expect(response.body.student.studentId).toMatch(/^STU-\d{4}-\d{4}$/);
    });

    it('should reject student creation for non-admin users', async () => {
      const { token } = await createTestUser('teacher');
      
      const studentData = {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        age: 19,
        gradeLevel: '11th Grade'
      };

      const response = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .send(studentData)
        .expect(403);

      expect(response.body.error).toBe('Access denied. Admin privileges required.');
    });

    it('should reject student creation without authentication', async () => {
      const studentData = {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        age: 19,
        gradeLevel: '11th Grade'
      };

      const response = await request(app)
        .post('/api/students')
        .send(studentData)
        .expect(401);

      expect(response.body.error).toBe('Access denied. No token provided.');
    });

    it('should reject student creation with missing required fields', async () => {
      const { token } = await createTestUser('admin');
      
      const invalidData = {
        name: 'John Doe',
        // Missing email, age, gradeLevel
      };

      const response = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
      expect(response.body.required).toEqual(['name', 'email', 'age', 'gradeLevel']);
    });

    it('should reject student creation with invalid email', async () => {
      const { token } = await createTestUser('admin');
      
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 20,
        gradeLevel: '12th Grade'
      };

      const response = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Invalid email format');
    });

    it('should reject student creation with invalid age', async () => {
      const { token } = await createTestUser('admin');
      
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30, // Too old
        gradeLevel: '12th Grade'
      };

      const response = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Age must be a number between 3 and 25');
    });

    it('should reject duplicate email addresses', async () => {
      const { token } = await createTestUser('admin');
      
      // Create first student
      await Student.create({
        name: 'First Student',
        email: 'duplicate@example.com',
        age: 18,
        gradeLevel: '12th Grade'
      });

      const duplicateData = {
        name: 'Second Student',
        email: 'duplicate@example.com',
        age: 19,
        gradeLevel: '11th Grade'
      };

      const response = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .send(duplicateData)
        .expect(409);

      expect(response.body.error).toBe('Student with this email already exists');
      expect(response.body.conflictField).toBe('email');
    });
  });

  describe('GET /api/students', () => {
    it('should get all students with pagination (Admin)', async () => {
      const { token } = await createTestUser('admin');
      
      // Create test students
      await Student.create([
        { name: 'Student 1', email: 'student1@test.com', age: 18, gradeLevel: '12th' },
        { name: 'Student 2', email: 'student2@test.com', age: 17, gradeLevel: '11th' },
        { name: 'Student 3', email: 'student3@test.com', age: 16, gradeLevel: '10th' }
      ]);

      const response = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Students retrieved successfully');
      expect(response.body.students).toHaveLength(3);
      expect(response.body.pagination).toMatchObject({
        currentPage: 1,
        totalStudents: 3,
        hasNextPage: false,
        hasPreviousPage: false
      });
    });

    it('should allow teachers to get all students', async () => {
      const { token } = await createTestUser('teacher');
      
      await Student.create({
        name: 'Test Student',
        email: 'test@example.com',
        age: 18,
        gradeLevel: '12th'
      });

      const response = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.students).toHaveLength(1);
    });

    it('should handle pagination parameters', async () => {
      const { token } = await createTestUser('admin');
      
      // Create 15 test students
      const students = Array.from({ length: 15 }, (_, i) => ({
        name: `Student ${i + 1}`,
        email: `student${i + 1}@test.com`,
        age: 18,
        gradeLevel: '12th'
      }));
      await Student.create(students);

      const response = await request(app)
        .get('/api/students?page=2&limit=5')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.students).toHaveLength(5);
      expect(response.body.pagination).toMatchObject({
        currentPage: 2,
        totalStudents: 15,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true
      });
    });
  });

  describe('GET /api/students/:id', () => {
    it('should get a student by valid ID', async () => {
      const { token } = await createTestUser('admin');
      
      const student = await Student.create({
        name: 'Test Student',
        email: 'test@example.com',
        age: 18,
        gradeLevel: '12th',
        grades: [{ subject: 'Math', score: 95 }]
      });

      const response = await request(app)
        .get(`/api/students/${student._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.student).toMatchObject({
        name: 'Test Student',
        email: 'test@example.com',
        age: 18,
        gradeLevel: '12th'
      });
      expect(response.body.student.grades).toHaveLength(1);
      expect(response.body.student.grades[0]).toMatchObject({
        subject: 'Math',
        score: 95
      });
    });

    it('should return 404 for non-existent student ID', async () => {
      const { token } = await createTestUser('admin');
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but doesn't exist

      const response = await request(app)
        .get(`/api/students/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toBe('Student not found');
    });

    it('should return 400 for invalid ID format', async () => {
      const { token } = await createTestUser('admin');
      const invalidId = 'invalid-id';

      const response = await request(app)
        .get(`/api/students/${invalidId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.error).toBe('Invalid student ID format');
    });
  });
});