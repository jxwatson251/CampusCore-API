import { Request, Response } from 'express';
import Student, { IStudent } from '../models/Student';

export const addStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, age, gradeLevel, studentId } = req.body;

    if (!name || !email || !age || !gradeLevel) {
      res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'email', 'age', 'gradeLevel'],
        received: {
          name: !!name,
          email: !!email,
          age: !!age,
          gradeLevel: !!gradeLevel
        }
      });
      return;
    }

    if (typeof age !== 'number' || age < 3 || age > 25) {
      res.status(400).json({ 
        error: 'Age must be a number between 3 and 25' 
      });
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ 
        error: 'Invalid email format' 
      });
      return;
    }

    const existingStudent = await Student.findOne({ email: email.toLowerCase().trim() });
    if (existingStudent) {
      res.status(409).json({ 
        error: 'Student with this email already exists',
        conflictField: 'email'
      });
      return;
    }

    if (studentId) {
      const existingId = await Student.findOne({ studentId: studentId.trim() });
      if (existingId) {
        res.status(409).json({ 
          error: 'Student ID already exists',
          conflictField: 'studentId'
        });
        return;
      }
    }

    const studentData: Partial<IStudent> = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      age: Number(age),
      gradeLevel: gradeLevel.trim(),
      ...(studentId && { studentId: studentId.trim() })
    };

    const student = await Student.create(studentData);

    res.status(201).json({
      success: true,
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
 
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ 
        error: 'Validation failed',
        details: errors
      });
      return;
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      res.status(409).json({ 
        error: `Duplicate ${field}: This ${field} already exists`,
        conflictField: field
      });
      return;
    }

    res.status(500).json({ 
      error: 'Failed to add student',
      message: 'An internal server error occurred'
    });
  }
};

export const getAllStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const students = await Student.find({}, '-grades')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalStudents = await Student.countDocuments();
    const totalPages = Math.ceil(totalStudents / limit);

    res.json({
      success: true,
      message: 'Students retrieved successfully',
      pagination: {
        currentPage: page,
        totalPages,
        totalStudents,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
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
      error: 'Failed to fetch students',
      message: 'An internal server error occurred'
    });
  }
};

export const getStudentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ 
        error: 'Invalid student ID format' 
      });
      return;
    }
    
    const student = await Student.findById(id);
    if (!student) {
      res.status(404).json({ 
        error: 'Student not found' 
      });
      return;
    }

    res.json({
      success: true,
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
      error: 'Failed to fetch student',
      message: 'An internal server error occurred'
    });
  }
}