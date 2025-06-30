import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Student from '../models/Student';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, role, studentId } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }

    if (role === 'student' && !studentId) {
      return res.status(400).json({ 
        error: 'Student ID is required for student registration' 
      });
    }

    if (studentId) {
      const student = await Student.findOne({ studentId });
      if (!student) {
        return res.status(404).json({ 
          error: 'Student not found with the provided Student ID' 
        });
      }

      const existingUser = await User.findOne({ studentId });
      if (existingUser) {
        return res.status(409).json({ 
          error: 'Student already has a user account' 
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData: any = { 
      username, 
      password: hashedPassword, 
      role: role || 'admin'
    };

    if (studentId) {
      userData.studentId = studentId;
    }

    const user = await User.create(userData);
    
    res.status(201).json({ 
      message: 'User registered successfully', 
      user: { 
        username: user.username, 
        role: user.role,
        ...(user.studentId && { studentId: user.studentId })
      } 
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(409).json({ 
        error: `${field} already exists` 
      });
    }
    
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokenPayload: any = { 
      userId: user._id, 
      role: user.role 
    };

    if (user.role === 'student' && user.studentId) {
      tokenPayload.studentId = user.studentId;
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ 
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        ...(user.studentId && { studentId: user.studentId })
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}