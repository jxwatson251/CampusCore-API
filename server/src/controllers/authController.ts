import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, role, studentId } = req.body;

    // Validation
    if (!username || !password || !role) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['username', 'password', 'role']
      });
    }

    if (!['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be admin, teacher, or student' 
      });
    }

    if (role === 'student' && !studentId) {
      return res.status(400).json({ 
        error: 'Student ID is required for student role' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Username already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user data
    const userData: any = {
      username: username.toLowerCase().trim(),
      password: hashedPassword,
      role
    };

    if (role === 'student' && studentId) {
      userData.studentId = studentId.trim();
    }

    // Create user
    const user = await User.create(userData);
    
    res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
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
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors
      });
    }
    
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['username', 'password']
      });
    }

    // Find user by username
    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Create JWT token
    const tokenPayload: any = {
      userId: user._id,
      role: user.role
    };

    // Add studentId to token if user is a student
    if (user.role === 'student' && user.studentId) {
      tokenPayload.studentId = user.studentId;
    }

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
      expiresIn: '24h' // Token expires in 24 hours
    });
    
    res.json({ 
      success: true,
      message: 'Login successful',
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        role: user.role,
        ...(user.studentId && { studentId: user.studentId })
      } 
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};