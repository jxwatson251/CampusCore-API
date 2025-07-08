import express from 'express';
import { register, login } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected route to verify token
router.get('/verify', authenticate, (req: any, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: {
      userId: req.user.userId,
      role: req.user.role,
      ...(req.user.studentId && { studentId: req.user.studentId })
    }
  });
});

// Route to refresh token (optional)
router.post('/refresh', authenticate, (req: any, res) => {
  try {
    const newToken = jwt.sign(
      {
        userId: req.user.userId,
        role: req.user.role,
        ...(req.user.studentId && { studentId: req.user.studentId })
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to refresh token'
    });
  }
});

// Route to logout (client-side should discard token)
router.post('/logout', authenticate, (req: any, res) => {
  res.json({
    success: true,
    message: 'Logout successful. Please discard your token on the client side.'
  });
});

export default router;