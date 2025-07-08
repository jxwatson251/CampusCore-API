import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    studentId?: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'Access denied. No valid token provided.',
        message: 'Authorization header must be in format: Bearer <token>'
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Optional: Verify user still exists in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ 
        error: 'Invalid token. User not found.' 
      });
      return;
    }

    // Set user data in request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      ...(decoded.studentId && { studentId: decoded.studentId })
    };
    
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ 
        error: 'Token expired. Please login again.' 
      });
      return;
    }
    
    if (err.name === 'JsonWebTokenError') {
      res.status(401).json({ 
        error: 'Invalid token format.' 
      });
      return;
    }
    
    console.error('Authentication error:', err);
    res.status(401).json({ 
      error: 'Token verification failed' 
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
      error: 'Access denied. Admin privileges required.',
      userRole: req.user.role,
      requiredRole: 'admin'
    });
    return;
  }

  next();
};

export const requireTeacher = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Authentication required' 
    });
    return;
  }

  if (req.user.role !== 'teacher') {
    res.status(403).json({ 
      error: 'Access denied. Teacher privileges required.',
      userRole: req.user.role,
      requiredRole: 'teacher'
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
      error: 'Access denied. Admin or teacher privileges required.',
      userRole: req.user.role,
      requiredRoles: ['admin', 'teacher']
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
      error: 'Access denied. Student privileges required.',
      userRole: req.user.role,
      requiredRole: 'student'
    });
    return;
  }

  // Additional check for student: ensure they have a studentId
  if (!req.user.studentId) {
    res.status(403).json({ 
      error: 'Access denied. Valid student ID required.' 
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

  const validRoles = ['admin', 'teacher', 'student'];
  if (!validRoles.includes(req.user.role)) {
    res.status(403).json({ 
      error: 'Access denied. Valid role required.',
      userRole: req.user.role,
      validRoles
    });
    return;
  }

  next();
};

// Middleware to allow multiple roles
export const requireAnyRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required' 
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Access denied. Insufficient privileges.',
        userRole: req.user.role,
        allowedRoles
      });
      return;
    }

    next();
  };
};