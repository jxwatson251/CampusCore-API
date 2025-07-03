import express from 'express';
import { addStudent, getAllStudents, getStudentById } from '../controllers/studentController';
import { authenticate, requireAdmin, requireAdminOrTeacher } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', authenticate, requireAdmin, addStudent);

router.get('/', authenticate, requireAdminOrTeacher, getAllStudents);
router.get('/:id', authenticate, requireAdminOrTeacher, getStudentById);

export default router