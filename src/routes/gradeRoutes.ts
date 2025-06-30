import express from 'express';
import { 
  addOrUpdateGrade, 
  getStudentGrades, 
  removeGrade, 
  getGradesSummary 
} from '../controllers/gradeController';
import { authenticate, requireAdminOrTeacher } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(authenticate);
router.use(requireAdminOrTeacher);

router.post('/student/:studentId', addOrUpdateGrade);
router.get('/student/:studentId', getStudentGrades);
router.delete('/student/:studentId', removeGrade);
router.get('/summary', getGradesSummary);

export default router;