import { Request, Response } from 'express';
import Student from '../models/Student';

export const addStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, name, email, age, gradeLevel } = req.body;

    if (!studentId || !name || !email || !age || !gradeLevel) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['studentId', 'name', 'email', 'age', 'gradeLevel']
      });
      return;
    }

    const existingEmail = await Student.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }

    const existingStudentId = await Student.findOne({ studentId: studentId.trim() });
    if (existingStudentId) {
      res.status(409).json({ error: 'Student ID already exists' });
      return;
    }

    const newStudent = new Student({
      studentId: studentId.trim(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      age: Number(age),
      gradeLevel: gradeLevel.trim()
    });

    await newStudent.save();

    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      student: newStudent
    });

  } catch (error: any) {
    console.error('Error adding student:', error);
    res.status(500).json({ error: 'Failed to add student' });
  }
};

export const getAllStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const students = await Student.find();
    res.json({ students });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

export const getStudentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    res.json({ student });

  } catch (error: any) {
    console.error('Error fetching student by ID:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
}