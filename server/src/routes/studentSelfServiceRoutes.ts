import express from 'express';
import { 
  getMyGrades, 
  getMyGradeBySubject, 
  getMyAcademicSummary 
} from '../controllers/studentGradesController';
import { authenticate, requireStudent } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(authenticate);
router.use(requireStudent);

router.get('/grades', getMyGrades);

router.get('/grades/:subject', getMyGradeBySubject);

router.get('/summary', getMyAcademicSummary);

export default router