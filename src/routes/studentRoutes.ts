import express from 'express';
import { 
  getMyGrades, 
  getMyGradeBySubject, 
  getMyAcademicSummary 
} from '../controllers/studentGradesController';
import { authenticate, requireStudent } from '../middlewares/authMiddleware';

const router = express.Router();

// All routes require authentication and student role
router.use(authenticate);
router.use(requireStudent);

// GET /api/student/grades - Get all my grades
router.get('/grades', getMyGrades);

// GET /api/student/grades/:subject - Get grade for specific subject
router.get('/grades/:subject', getMyGradeBySubject);

// GET /api/student/summary - Get comprehensive academic summary
router.get('/summary', getMyAcademicSummary);

export default router