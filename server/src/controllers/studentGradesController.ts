import { Request, Response } from 'express';
import Student from '../models/Student';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    studentId?: string;
  };
}

export const getMyGrades = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'student') {
      res.status(403).json({ 
        error: 'Access denied. Student role required.' 
      });
      return;
    }

    const { studentId } = req.user;
    if (!studentId) {
      res.status(400).json({ 
        error: 'Student ID not found in authentication token' 
      });
      return;
    }

    const student = await Student.findOne({ studentId }, 'name studentId grades');
    if (!student) {
      res.status(404).json({ 
        error: 'Student record not found' 
      });
      return;
    }

    let averageGrade = null;
    if (student.grades.length > 0) {
      const totalScore = student.grades.reduce((sum, grade) => sum + grade.score, 0);
      averageGrade = Math.round((totalScore / student.grades.length) * 100) / 100;
    }

    const gradesBySubject = student.grades.reduce((acc, grade) => {
      acc[grade.subject] = grade.score;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      message: 'Grades retrieved successfully',
      student: {
        name: student.name,
        studentId: student.studentId,
        gradesCount: student.grades.length,
        averageGrade
      },
      grades: student.grades.map(grade => ({
        subject: grade.subject,
        score: grade.score
      })),
      gradesBySubject,
      summary: {
        totalSubjects: student.grades.length,
        averageGrade,
        highestGrade: student.grades.length > 0 ? Math.max(...student.grades.map(g => g.score)) : null,
        lowestGrade: student.grades.length > 0 ? Math.min(...student.grades.map(g => g.score)) : null
      }
    });

  } catch (error: any) {
    console.error('Error fetching student grades:', error);
    res.status(500).json({ 
      error: 'Failed to fetch grades',
      message: 'An internal server error occurred'
    });
  }
};

export const getMyGradeBySubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'student') {
      res.status(403).json({ 
        error: 'Access denied. Student role required.' 
      });
      return;
    }

    const { subject } = req.params;
    const { studentId } = req.user;

    if (!studentId) {
      res.status(400).json({ 
        error: 'Student ID not found in authentication token' 
      });
      return;
    }

    if (!subject || subject.trim().length === 0) {
      res.status(400).json({ 
        error: 'Subject parameter is required' 
      });
      return;
    }

    const student = await Student.findOne({ studentId }, 'name studentId grades');
    if (!student) {
      res.status(404).json({ 
        error: 'Student record not found' 
      });
      return;
    }

    const subjectTrimmed = subject.trim();
    const grade = student.grades.find(
      g => g.subject.toLowerCase() === subjectTrimmed.toLowerCase()
    );

    if (!grade) {
      res.status(404).json({ 
        error: 'Grade not found for the specified subject',
        availableSubjects: student.grades.map(g => g.subject)
      });
      return;
    }

    res.json({
      success: true,
      message: `Grade for ${grade.subject} retrieved successfully`,
      student: {
        name: student.name,
        studentId: student.studentId
      },
      grade: {
        subject: grade.subject,
        score: grade.score
      }
    });

  } catch (error: any) {
    console.error('Error fetching grade by subject:', error);
    res.status(500).json({ 
      error: 'Failed to fetch grade',
      message: 'An internal server error occurred'
    });
  }
};

export const getMyAcademicSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'student') {
      res.status(403).json({ 
        error: 'Access denied. Student role required.' 
      });
      return;
    }

    const { studentId } = req.user;
    if (!studentId) {
      res.status(400).json({ 
        error: 'Student ID not found in authentication token' 
      });
      return;
    }

    const student = await Student.findOne({ studentId });
    if (!student) {
      res.status(404).json({ 
        error: 'Student record not found' 
      });
      return;
    }

    const grades = student.grades;
    let academicSummary = {
      totalSubjects: grades.length,
      averageGrade: null as number | null,
      highestGrade: null as { subject: string; score: number } | null,
      lowestGrade: null as { subject: string; score: number } | null,
      gradeDistribution: {
        A: 0,  // 90-100
        B: 0,  // 80-89
        C: 0,  // 70-79
        D: 0,  // 60-69
        F: 0   // Below 60
      },
      subjectGrades: grades.map(g => ({ subject: g.subject, score: g.score }))
    };

    if (grades.length > 0) {
      const totalScore = grades.reduce((sum, grade) => sum + grade.score, 0);
      academicSummary.averageGrade = Math.round((totalScore / grades.length) * 100) / 100;

      const sortedGrades = [...grades].sort((a, b) => b.score - a.score);
      academicSummary.highestGrade = {
        subject: sortedGrades[0].subject,
        score: sortedGrades[0].score
      };
      academicSummary.lowestGrade = {
        subject: sortedGrades[sortedGrades.length - 1].subject,
        score: sortedGrades[sortedGrades.length - 1].score
      };

      grades.forEach(grade => {
        if (grade.score >= 90) academicSummary.gradeDistribution.A++;
        else if (grade.score >= 80) academicSummary.gradeDistribution.B++;
        else if (grade.score >= 70) academicSummary.gradeDistribution.C++;
        else if (grade.score >= 60) academicSummary.gradeDistribution.D++;
        else academicSummary.gradeDistribution.F++;
      });
    }

    res.json({
      success: true,
      message: 'Academic summary retrieved successfully',
      student: {
        name: student.name,
        studentId: student.studentId,
        email: student.email,
        age: student.age,
        gradeLevel: student.gradeLevel
      },
      academicSummary
    });

  } catch (error: any) {
    console.error('Error fetching academic summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch academic summary',
      message: 'An internal server error occurred'
    });
  }
}