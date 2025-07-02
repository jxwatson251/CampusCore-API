import { Request, Response } from 'express';
import Student from '../models/Student';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const addOrUpdateGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { subject, score } = req.body;

    if (!subject || score === undefined || score === null) {
      res.status(400).json({ 
        error: 'Missing required fields',
        required: ['subject', 'score'],
        received: {
          subject: !!subject,
          score: score !== undefined && score !== null
        }
      });
      return;
    }

    if (typeof score !== 'number' || score < 0 || score > 100) {
      res.status(400).json({ 
        error: 'Score must be a number between 0 and 100' 
      });
      return;
    }

    if (typeof subject !== 'string' || subject.trim().length === 0) {
      res.status(400).json({ 
        error: 'Subject must be a non-empty string' 
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      res.status(400).json({ 
        error: 'Invalid student ID format' 
      });
      return;
    }

    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ 
        error: 'Student not found' 
      });
      return;
    }

    const subjectTrimmed = subject.trim();
    const existingGradeIndex = student.grades.findIndex(
      grade => grade.subject.toLowerCase() === subjectTrimmed.toLowerCase()
    );

    let action: 'added' | 'updated';
    
    if (existingGradeIndex !== -1) {
      student.grades[existingGradeIndex].score = score;
      action = 'updated';
    } else {
      student.grades.push({ subject: subjectTrimmed, score });
      action = 'added';
    }

    await student.save();

    res.json({
      success: true,
      message: `Grade ${action} successfully`,
      grade: {
        subject: subjectTrimmed,
        score,
        action
      },
      student: {
        id: student._id,
        name: student.name,
        studentId: student.studentId
      }
    });

  } catch (error: any) {
    console.error('Error adding/updating grade:', error);
    res.status(500).json({ 
      error: 'Failed to add/update grade',
      message: 'An internal server error occurred'
    });
  }
};

export const getStudentGrades = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      res.status(400).json({ 
        error: 'Invalid student ID format' 
      });
      return;
    }

    const student = await Student.findById(studentId, 'name studentId grades');
    if (!student) {
      res.status(404).json({ 
        error: 'Student not found' 
      });
      return;
    }

    let averageGrade = null;
    if (student.grades.length > 0) {
      const totalScore = student.grades.reduce((sum, grade) => sum + grade.score, 0);
      averageGrade = Math.round((totalScore / student.grades.length) * 100) / 100;
    }

    res.json({
      success: true,
      message: 'Student grades retrieved successfully',
      student: {
        id: student._id,
        name: student.name,
        studentId: student.studentId,
        gradesCount: student.grades.length,
        averageGrade
      },
      grades: student.grades.map(grade => ({
        subject: grade.subject,
        score: grade.score
      }))
    });

  } catch (error: any) {
    console.error('Error fetching student grades:', error);
    res.status(500).json({ 
      error: 'Failed to fetch student grades',
      message: 'An internal server error occurred'
    });
  }
};

export const removeGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { subject } = req.body;

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      res.status(400).json({ 
        error: 'Subject is required and must be a non-empty string' 
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      res.status(400).json({ 
        error: 'Invalid student ID format' 
      });
      return;
    }

    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ 
        error: 'Student not found' 
      });
      return;
    }

    const subjectTrimmed = subject.trim();
    const gradeIndex = student.grades.findIndex(
      grade => grade.subject.toLowerCase() === subjectTrimmed.toLowerCase()
    );

    if (gradeIndex === -1) {
      res.status(404).json({ 
        error: 'Grade not found for the specified subject',
        availableSubjects: student.grades.map(g => g.subject)
      });
      return;
    }

    const removedGrade = student.grades[gradeIndex];
    student.grades.splice(gradeIndex, 1);
    await student.save();

    res.json({
      success: true,
      message: 'Grade removed successfully',
      removedGrade: {
        subject: removedGrade.subject,
        score: removedGrade.score
      },
      student: {
        id: student._id,
        name: student.name,
        studentId: student.studentId
      }
    });

  } catch (error: any) {
    console.error('Error removing grade:', error);
    res.status(500).json({ 
      error: 'Failed to remove grade',
      message: 'An internal server error occurred'
    });
  }
};

export const getGradesSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const subject = req.query.subject as string;
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      {
        $project: {
          name: 1,
          studentId: 1,
          grades: 1,
          gradesCount: { $size: '$grades' },
          averageGrade: {
            $cond: {
              if: { $gt: [{ $size: '$grades' }, 0] },
              then: { $avg: '$grades.score' },
              else: null
            }
          }
        }
      }
    ];

    if (subject && subject.trim()) {
      pipeline.unshift({
        $match: {
          'grades.subject': { $regex: new RegExp(subject.trim(), 'i') }
        }
      });
    }

    pipeline.push({ $skip: skip }, { $limit: limit });

    const students = await Student.aggregate(pipeline);
    const totalStudents = await Student.countDocuments(
      subject ? { 'grades.subject': { $regex: new RegExp(subject.trim(), 'i') } } : {}
    );
    const totalPages = Math.ceil(totalStudents / limit);

    const formattedStudents = students.map(student => ({
      id: student._id,
      name: student.name,
      studentId: student.studentId,
      gradesCount: student.gradesCount,
      averageGrade: student.averageGrade ? Math.round(student.averageGrade * 100) / 100 : null,
      grades: subject 
        ? student.grades.filter((g: any) => 
            g.subject.toLowerCase().includes(subject.toLowerCase())
          )
        : student.grades
    }));

    res.json({
      success: true,
      message: 'Grades summary retrieved successfully',
      filters: {
        subject: subject || null
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalStudents,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      students: formattedStudents
    });

  } catch (error: any) {
    console.error('Error fetching grades summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch grades summary',
      message: 'An internal server error occurred'
    });
  }
}