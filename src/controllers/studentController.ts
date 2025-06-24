import { Request, Response } from 'express';
import Student, { IStudent } from '../models/Student';

// Add a new student (Admin only)
export const addStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, age, gradeLevel, studentId } = req.body;

    // Validate required fields
    if (!name || !email || !age || !gradeLevel) {
      res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'email', 'age', 'gradeLevel']
      });
      return;
    }

    // Check if student with email already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      res.status(409).json({ 
        error: 'Student with this email already exists' 
      });
      return;
    }

    // If studentId is provided, check if it's unique
    if (studentId) {
      const existingId = await Student.findOne({ studentId });
      if (existingId) {
        res.status(409).json({ 
          error: 'Student ID already exists' 
        });
        return;
      }
    }

    // Create new student
    const studentData: Partial<IStudent> = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      age: Number(age),
      gradeLevel: gradeLevel.trim(),
      ...(studentId && { studentId: studentId.trim() })
    };

    const student = await Student.create(studentData);

    res.status(201).json({
      message: 'Student added successfully',
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        age: student.age,
        gradeLevel: student.gradeLevel,
        createdAt: student.createdAt
      }
    });

  } catch (error: any) {
    console.error('Error adding student:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ 
        error: 'Validation failed',
        details: errors
      });
      return;
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(409).json({ 
        error: `${field} already exists` 
      });
      return;
    }

    res.status(500).json({ 
      error: 'Failed to add student',
      message: 'An internal server error occurred'
    });
  }
};

// Get all students
export const getAllStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const students = await Student.find({}, '-grades').sort({ createdAt: -1 });
    
    res.json({
      message: 'Students retrieved successfully',
      count: students.length,
      students: students.map(student => ({
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        age: student.age,
        gradeLevel: student.gradeLevel,
        createdAt: student.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      error: 'Failed to fetch students' 
    });
  }
};

// Get student by ID
export const getStudentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const student = await Student.findById(id);
    if (!student) {
      res.status(404).json({ 
        error: 'Student not found' 
      });
      return;
    }

    res.json({
      message: 'Student retrieved successfully',
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        age: student.age,
        gradeLevel: student.gradeLevel,
        grades: student.grades,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ 
      error: 'Failed to fetch student' 
    });
  }
}