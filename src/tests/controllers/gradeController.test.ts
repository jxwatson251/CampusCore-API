import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import Student from '../../models/Student';
import User from '../../models/User';
import gradeRoutes from '../../routes/gradeRoutes';

const app = express();
app.use(express.json());
app.use('/api/grades', gradeRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Helper function to create a test user and get token
const createTestUser = async (role: 'admin' | 'teacher' = 'teacher') => {
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

describe('Grade Controller', () => {
  describe('POST /api/grades/student/:studentId', () => {
    it('should add a new grade for a student', async () => {
      const { token } = await createTestUser('teacher');
      
      const student = await Student.create({
        name: 'John Doe',
        email: 'john@example.com',
        age: 18,
        gradeLevel: '12th'
      });

      const gradeData = {
        subject: 'Mathematics',
        score: 95
      };

      const response = await request(app)
        .post(`/api/grades/student/${student._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(gradeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Grade added successfully');
      expect(response.body.grade).toMatchObject({
        subject: 'Mathematics',
        score: 95,
        action: 'added'
      });
    });

    it('should update existing grade for same subject', async () => {
      const { token } = await createTestUser('teacher');
      
      const student = await Student.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        age: 17,
        gradeLevel: '11th',
        grades: [{ subject: 'Mathematics', score: 85 }]
      });

      const updatedGradeData = {
        subject: 'Mathematics',
        score: 92
      };

      const response = await request(app)
        .post(`/api/grades/student/${student._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedGradeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Grade updated successfully');
      expect(response.body.grade.action).toBe('updated');
      expect(response.body.grade.score).toBe(92);
    });

    it('should reject invalid score values', async () => {
      const { token } = await createTestUser('teacher');
      
      const student = await Student.create({
        name: 'Test Student',
        email: 'test@example.com',
        age: 18,
        gradeLevel: '12th'
      });

      const invalidGradeData = {
        subject: 'Science',
        score: 150 // Invalid: above 100
      };

      const response = await request(app)
        .post(`/api/grades/student/${student._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(invalidGradeData)
        .expect(400);

      expect(response.body.error).toBe('Score must be a number between 0 and 100');
    });
  });

  describe('GET /api/grades/student/:studentId', () => {
    it('should get all grades for a student with average', async () => {
      const { token } = await createTestUser('teacher');
      
      const student = await Student.create({
        name: 'Student with Grades',
        email: 'grades@example.com',
        age: 18,
        gradeLevel: '12th',
        grades: [
          { subject: 'Mathematics', score: 90 },
          { subject: 'Science', score: 85 },
          { subject: 'English', score: 95 }
        ]
      });

      const response = await request(app)
        .get(`/api/grades/student/${student._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.student.gradesCount).toBe(3);
      expect(response.body.student.averageGrade).toBe(90);
      expect(response.body.grades).toHaveLength(3);
    });
  });

  describe('DELETE /api/grades/student/:studentId', () => {
    it('should remove a grade for specific subject', async () => {
      const { token } = await createTestUser('admin');
      
      const student = await Student.create({
        name: 'Student with Grades',
        email: 'remove@example.com',
        age: 18,
        gradeLevel: '12th',
        grades: [
          { subject: 'Mathematics', score: 90 },
          { subject: 'Science', score: 85 }
        ]
      });

      const response = await request(app)
        .delete(`/api/grades/student/${student._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ subject: 'Mathematics' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Grade removed successfully');
      expect(response.body.removedGrade.subject).toBe('Mathematics');
    });
  });

  describe('GET /api/grades/summary', () => {
    it('should get grades summary for all students', async () => {
      const { token } = await createTestUser('teacher');
      
      await Student.create([
        {
          name: 'Student 1',
          email: 'student1@example.com',
          age: 18,
          gradeLevel: '12th',
          grades: [
            { subject: 'Math', score: 90 },
            { subject: 'Science', score: 85 }
          ]
        },
        {
          name: 'Student 2',
          email: 'student2@example.com',
          age: 17,
          gradeLevel: '11th',
          grades: [
            { subject: 'Math', score: 95 },
            { subject: 'English', score: 88 }
          ]
        }
      ]);

      const response = await request(app)
        .get('/api/grades/summary')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.students).toHaveLength(2);
      expect(response.body.students[0].averageGrade).toBeDefined();
    });
  });
});