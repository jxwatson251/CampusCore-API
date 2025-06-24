import Student from '../../src/models/Student';

describe('Student Model', () => {
  describe('Student Creation', () => {
    it('should create a student with valid data', async () => {
      const studentData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        age: 20,
        gradeLevel: '12th Grade'
      };

      const student = await Student.create(studentData);

      expect(student.name).toBe(studentData.name);
      expect(student.email).toBe(studentData.email.toLowerCase());
      expect(student.age).toBe(studentData.age);
      expect(student.gradeLevel).toBe(studentData.gradeLevel);
      expect(student.grades).toEqual([]);
      expect(student.createdAt).toBeDefined();
      expect(student.updatedAt).toBeDefined();
    });

    it('should auto-generate studentId when not provided', async () => {
      const studentData = {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        age: 19,
        gradeLevel: '11th Grade'
      };

      const student = await Student.create(studentData);

      expect(student.studentId).toBeDefined();
      expect(student.studentId).toMatch(/^STU-\d{4}-\d{4}$/);
      
      const currentYear = new Date().getFullYear();
      expect(student.studentId).toContain(`STU-${currentYear}-`);
    });

    it('should use provided studentId when given', async () => {
      const customStudentId = 'CUSTOM-2024-0001';
      const studentData = {
        name: 'Custom Student',
        email: 'custom@example.com',
        age: 18,
        gradeLevel: '12th Grade',
        studentId: customStudentId
      };

      const student = await Student.create(studentData);

      expect(student.studentId).toBe(customStudentId);
    });

    it('should increment studentId counter correctly', async () => {
      const currentYear = new Date().getFullYear();
      
      // Create first student
      const student1 = await Student.create({
        name: 'Student 1',
        email: 'student1@example.com',
        age: 18,
        gradeLevel: '12th'
      });

      // Create second student
      const student2 = await Student.create({
        name: 'Student 2',
        email: 'student2@example.com',
        age: 19,
        gradeLevel: '11th'
      });

      expect(student1.studentId).toBe(`STU-${currentYear}-0001`);
      expect(student2.studentId).toBe(`STU-${currentYear}-0002`);
    });
  });

  describe('Student Validation', () => {
    it('should require name field', async () => {
      const invalidData = {
        email: 'test@example.com',
        age: 18,
        gradeLevel: '12th'
        // Missing name
      };

      await expect(Student.create(invalidData)).rejects.toThrow();
    });

    it('should require email field', async () => {
      const invalidData = {
        name: 'Test Student',
        age: 18,
        gradeLevel: '12th'
        // Missing email
      };

      await expect(Student.create(invalidData)).rejects.toThrow();
    });

    it('should require age field', async () => {
      const invalidData = {
        name: 'Test Student',
        email: 'test@example.com',
        gradeLevel: '12th'
        // Missing age
      };

      await expect(Student.create(invalidData)).rejects.toThrow();
    });

    it('should require gradeLevel field', async () => {
      const invalidData = {
        name: 'Test Student',
        email: 'test@example.com',
        age: 18
        // Missing gradeLevel
      };

      await expect(Student.create(invalidData)).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const invalidData = {
        name: 'Test Student',
        email: 'invalid-email-format',
        age: 18,
        gradeLevel: '12th'
      };

      await expect(Student.create(invalidData)).rejects.toThrow();
    });

    it('should enforce minimum age constraint', async () => {
      const invalidData = {
        name: 'Too Young',
        email: 'young@example.com',
        age: 2, // Below minimum of 3
        gradeLevel: 'Preschool'
      };

      await expect(Student.create(invalidData)).rejects.toThrow();
    });

    it('should enforce maximum age constraint', async () => {
      const invalidData = {
        name: 'Too Old',
        email: 'old@example.com',
        age: 30, // Above maximum of 25
        gradeLevel: 'Graduate'
      };

      await expect(Student.create(invalidData)).rejects.toThrow();
    });

    it('should enforce unique email constraint', async () => {
      const studentData1 = {
        name: 'Student 1',
        email: 'duplicate@example.com',
        age: 18,
        gradeLevel: '12th'
      };

      const studentData2 = {
        name: 'Student 2',
        email: 'duplicate@example.com', // Same email
        age: 19,
        gradeLevel: '11th'
      };

      await Student.create(studentData1);
      await expect(Student.create(studentData2)).rejects.toThrow();
    });

    it('should enforce unique studentId constraint', async () => {
      const duplicateId = 'DUPLICATE-ID-001';
      
      const studentData1 = {
        name: 'Student 1',
        email: 'student1@example.com',
        age: 18,
        gradeLevel: '12th',
        studentId: duplicateId
      };

      const studentData2 = {
        name: 'Student 2',
        email: 'student2@example.com',
        age: 19,
        gradeLevel: '11th',
        studentId: duplicateId // Same studentId
      };

      await Student.create(studentData1);
      await expect(Student.create(studentData2)).rejects.toThrow();
    });
  });

  describe('Student Data Processing', () => {
    it('should convert email to lowercase', async () => {
      const studentData = {
        name: 'Test Student',
        email: 'TEST@EXAMPLE.COM',
        age: 18,
        gradeLevel: '12th'
      };

      const student = await Student.create(studentData);

      expect(student.email).toBe('test@example.com');
    });

    it('should trim whitespace from string fields', async () => {
      const studentData = {
        name: '  John Doe  ',
        email: '  john@example.com  ',
        age: 18,
        gradeLevel: '  12th Grade  '
      };

      const student = await Student.create(studentData);

      expect(student.name).toBe('John Doe');
      expect(student.email).toBe('john@example.com');
      expect(student.gradeLevel).toBe('12th Grade');
    });

    it('should handle grades array correctly', async () => {
      const studentData = {
        name: 'Test Student',
        email: 'test@example.com',
        age: 18,
        gradeLevel: '12th',
        grades: [
          { subject: 'Math', score: 95 },
          { subject: 'Science', score: 88 },
          { subject: 'English', score: 92 }
        ]
      };

      const student = await Student.create(studentData);

      expect(student.grades).toHaveLength(3);
      expect(student.grades[0]).toMatchObject({
        subject: 'Math',
        score: 95
      });
      expect(student.grades[1]).toMatchObject({
        subject: 'Science',
        score: 88
      });
      expect(student.grades[2]).toMatchObject({
        subject: 'English',
        score: 92
      });
    });
  });
});