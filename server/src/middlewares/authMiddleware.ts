import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    studentId?: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ 
      error: 'Access denied. No token provided.' 
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      ...(decoded.studentId && { studentId: decoded.studentId })
    };
    next();
  } catch (err) {
    res.status(400).json({ 
      error: 'Invalid token' 
    });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Authentication required' 
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
    return;
  }

  next();
};

export const requireAdminOrTeacher = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Authentication required' 
    });
    return;
  }

  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    res.status(403).json({ 
      error: 'Access denied. Admin or teacher privileges required.' 
    });
    return;
  }

  next();
};

export const requireStudent = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Authentication required' 
    });
    return;
  }

  if (req.user.role !== 'student') {
    res.status(403).json({ 
      error: 'Access denied. Student privileges required.' 
    });
    return;
  }

  next();
};

export const requireAuthenticated = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Authentication required' 
    });
    return;
  }

  if (!['admin', 'teacher', 'student'].includes(req.user.role)) {
    res.status(403).json({ 
      error: 'Access denied. Valid role required.' 
    });
    return;
  }

  next();
}