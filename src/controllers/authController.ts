import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const token = jwt.sign({ userId: 'user.id', role: 'user.role' }, process.env.JWT_SECRET!);
    
    res.json({ token, user: { id: 'user.id', email: 'user.email', role: 'user.role' } });
  } catch (error) {
    res.status(401).json({ error: 'Login failed' });
  }
};