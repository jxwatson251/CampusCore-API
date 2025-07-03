import { Request, Response } from 'express';
import Student, { IStudent } from '../models/Student';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

interface UpdateStudentRequest {
  name?: string;
  email?: string;
  age?: number;
  gradeLevel?: string;
  studentId?: string;
}

export const updateStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ 
        error: 'Access denied. Admin role required.' 
      });
      return;
    }

    const { id } = req.params;
    const updateData: UpdateStudentRequest = req.body;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ 
        error: 'Invalid student ID format' 
      });
      return;
    }

    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      res.status(404).json({ 
        error: 'Student not found' 
      });
      return;
    }

    const validationResult = await validateUpdateData(updateData, id);
    if (!validationResult.isValid) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.errors
      });
      return;
    }

    const updateObject: Partial<IStudent> = {};
    
    if (updateData.name !== undefined) {
      updateObject.name = updateData.name.trim();
    }
    
    if (updateData.email !== undefined) {
      updateObject.email = updateData.email.toLowerCase().trim();
    }
    
    if (updateData.age !== undefined) {
      updateObject.age = Number(updateData.age);
    }
    
    if (updateData.gradeLevel !== undefined) {
      updateObject.gradeLevel = updateData.gradeLevel.trim();
    }
    
    if (updateData.studentId !== undefined) {
      updateObject.studentId = updateData.studentId.trim();
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { ...updateObject, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      res.status(404).json({ 
        error: 'Student not found' 
      });
      return;
    }

    console.log(`Student updated by admin ${req.user.userId}:`, {
      studentId: id,
      updatedFields: Object.keys(updateObject),
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Student updated successfully',
      student: {
        id: updatedStudent._id,
        studentId: updatedStudent.studentId,
        name: updatedStudent.name,
        email: updatedStudent.email,
        age: updatedStudent.age,
        gradeLevel: updatedStudent.gradeLevel,
        createdAt: updatedStudent.createdAt,
        updatedAt: updatedStudent.updatedAt
      },
      updatedFields: Object.keys(updateObject)
    });

  } catch (error: any) {
    console.error('Error updating student:', error);

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
      error: 'Failed to update student',
      message: 'An internal server error occurred'
    });
  }
};

export const updateStudentPartial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ 
        error: 'Access denied. Admin role required.' 
      });
      return;
    }

    const { id } = req.params;
    const { field, value } = req.body;

    if (!field || value === undefined) {
      res.status(400).json({ 
        error: 'Missing required fields',
        required: ['field', 'value']
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ 
        error: 'Invalid student ID format' 
      });
      return;
    }

    const allowedFields = ['name', 'email', 'age', 'gradeLevel', 'studentId'];
    if (!allowedFields.includes(field)) {
      res.status(400).json({ 
        error: 'Invalid field',
        allowedFields
      });
      return;
    }

    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      res.status(404).json({ 
        error: 'Student not found' 
      });
      return;
    }

    const updateData = { [field]: value };
    const validationResult = await validateUpdateData(updateData, id);
    if (!validationResult.isValid) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.errors
      });
      return;
    }

    let updateValue = value;
    if (field === 'name' || field === 'gradeLevel' || field === 'studentId') {
      updateValue = String(value).trim();
    } else if (field === 'email') {
      updateValue = String(value).toLowerCase().trim();
    } else if (field === 'age') {
      updateValue = Number(value);
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { [field]: updateValue, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      res.status(404).json({ 
        error: 'Student not found' 
      });
      return;
    }

    console.log(`Student field updated by admin ${req.user.userId}:`, {
      studentId: id,
      field,
      oldValue: existingStudent[field as keyof IStudent],
      newValue: updateValue,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Student ${field} updated successfully`,
      student: {
        id: updatedStudent._id,
        studentId: updatedStudent.studentId,
        name: updatedStudent.name,
        email: updatedStudent.email,
        age: updatedStudent.age,
        gradeLevel: updatedStudent.gradeLevel,
        updatedAt: updatedStudent.updatedAt
      },
      updatedField: {
        field,
        oldValue: existingStudent[field as keyof IStudent],
        newValue: updateValue
      }
    });

  } catch (error: any) {
    console.error('Error updating student field:', error);

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
      error: 'Failed to update student field',
      message: 'An internal server error occurred'
    });
  }
};

async function validateUpdateData(
  updateData: UpdateStudentRequest, 
  currentStudentId: string
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  if (updateData.name !== undefined) {
    if (typeof updateData.name !== 'string' || updateData.name.trim().length === 0) {
      errors.push('Name must be a non-empty string');
    } else if (updateData.name.trim().length > 100) {
      errors.push('Name must be less than 100 characters');
    }
  }

  if (updateData.email !== undefined) {
    if (typeof updateData.email !== 'string') {
      errors.push('Email must be a string');
    } else {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(updateData.email)) {
        errors.push('Invalid email format');
      } else {
        const existingStudent = await Student.findOne({ 
          email: updateData.email.toLowerCase().trim(),
          _id: { $ne: currentStudentId }
        });
        if (existingStudent) {
          errors.push('Email already exists');
        }
      }
    }
  }

  if (updateData.age !== undefined) {
    const age = Number(updateData.age);
    if (isNaN(age) || age < 3 || age > 25) {
      errors.push('Age must be a number between 3 and 25');
    }
  }

  if (updateData.gradeLevel !== undefined) {
    if (typeof updateData.gradeLevel !== 'string' || updateData.gradeLevel.trim().length === 0) {
      errors.push('Grade level must be a non-empty string');
    }
  }

  if (updateData.studentId !== undefined) {
    if (typeof updateData.studentId !== 'string' || updateData.studentId.trim().length === 0) {
      errors.push('Student ID must be a non-empty string');
    } else {
      const existingStudent = await Student.findOne({ 
        studentId: updateData.studentId.trim(),
        _id: { $ne: currentStudentId }
      });
      if (existingStudent) {
        errors.push('Student ID already exists');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}