import { Request, Response } from 'express';
import Student from '../models/Student';
import mongoose from 'mongoose';
import Enrollment from '../models/Enrollment';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const deleteStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ 
        error: 'Access denied. Admin role required.' 
      });
      return;
    }

    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ 
        error: 'Invalid student ID format' 
      });
      return;
    }

    // Find the student first
    const student = await Student.findById(id);
    if (!student) {
      res.status(404).json({ 
        error: 'Student not found' 
      });
      return;
    }

    // Check for active enrollments
    const hasActiveEnrollments = await checkActiveEnrollments(id, student.studentId);
    if (hasActiveEnrollments.hasActive) {
      res.status(409).json({
        error: 'Cannot delete student with active enrollments',
        message: 'Student must be unenrolled from all courses before deletion',
        activeEnrollments: hasActiveEnrollments.enrollments,
        conflictReason: 'active_enrollments'
      });
      return;
    }

    // Store student data for response before deletion
    const studentData = {
      id: student._id.toString(),
      studentId: student.studentId,
      name: student.name,
      email: student.email,
      age: student.age,
      gradeLevel: student.gradeLevel,
      gradesCount: student.grades.length,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt
    };

    await Student.findByIdAndDelete(id);

    console.log(`Student deleted by admin ${req.user.userId}:`, {
      deletedStudent: studentData,
      timestamp: new Date().toISOString(),
      adminUserId: req.user.userId
    });

    res.json({
      success: true,
      message: 'Student deleted successfully',
      deletedStudent: studentData,
      deletionTimestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error deleting student:', error);
    res.status(500).json({ 
      error: 'Failed to delete student',
      message: 'An internal server error occurred'
    });
  }
};

export const bulkDeleteStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ 
        error: 'Access denied. Admin role required.' 
      });
      return;
    }

    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      res.status(400).json({ 
        error: 'Student IDs array is required and cannot be empty',
        expected: 'Array of student ID strings'
      });
      return;
    }

    const invalidIds = studentIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      res.status(400).json({ 
        error: 'Invalid student ID format(s)',
        invalidIds
      });
      return;
    }

    const students = await Student.find({ _id: { $in: studentIds } });
    
    if (students.length === 0) {
      res.status(404).json({ 
        error: 'No students found for the provided IDs' 
      });
      return;
    }

    const deletionResults = {
      successful: [] as any[],
      failed: [] as any[],
      blockedByEnrollments: [] as any[]
    };

    for (const student of students) {
      try {
        const hasActiveEnrollments = await checkActiveEnrollments(
          student._id.toString(), 
          student.studentId
        );

        if (hasActiveEnrollments.hasActive) {
          deletionResults.blockedByEnrollments.push({
            id: student._id,
            studentId: student.studentId,
            name: student.name,
            activeEnrollments: hasActiveEnrollments.enrollments
          });
        } else {
          await Student.findByIdAndDelete(student._id);
          
          deletionResults.successful.push({
            id: student._id,
            studentId: student.studentId,
            name: student.name,
            email: student.email
          });

          console.log(`Student deleted in bulk operation by admin ${req.user.userId}:`, {
            studentId: student._id,
            studentName: student.name,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        deletionResults.failed.push({
          id: student._id,
          studentId: student.studentId,
          name: student.name,
          error: 'Deletion failed due to server error'
        });
      }
    }

    let status = 200;
    let message = 'Bulk deletion completed';

    if (deletionResults.successful.length === 0) {
      if (deletionResults.blockedByEnrollments.length > 0) {
        status = 409;
        message = 'No students could be deleted due to active enrollments';
      } else {
        status = 500;
        message = 'All deletion attempts failed';
      }
    } else if (deletionResults.failed.length > 0 || deletionResults.blockedByEnrollments.length > 0) {
      status = 207; // Multi-status
      message = 'Bulk deletion partially completed';
    }

    res.status(status).json({
      success: deletionResults.successful.length > 0,
      message,
      summary: {
        requested: studentIds.length,
        found: students.length,
        deleted: deletionResults.successful.length,
        blockedByEnrollments: deletionResults.blockedByEnrollments.length,
        failed: deletionResults.failed.length
      },
      results: deletionResults,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error in bulk delete operation:', error);
    res.status(500).json({ 
      error: 'Bulk deletion failed',
      message: 'An internal server error occurred'
    });
  }
};

export const checkStudentDeletable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ 
        error: 'Access denied. Admin role required.' 
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ 
        error: 'Invalid student ID format' 
      });
      return;
    }

    const student = await Student.findById(id);
    if (!student) {
      res.status(404).json({ 
        error: 'Student not found' 
      });
      return;
    }

    const enrollmentCheck = await checkActiveEnrollments(id, student.studentId);

    res.json({
      success: true,
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email
      },
      isDeletable: !enrollmentCheck.hasActive,
      reason: enrollmentCheck.hasActive ? 'Has active enrollments' : 'No blocking factors',
      activeEnrollments: enrollmentCheck.enrollments,
      additionalInfo: {
        gradesCount: student.grades.length,
        createdAt: student.createdAt
      }
    });

  } catch (error: any) {
    console.error('Error checking student deletability:', error);
    res.status(500).json({ 
      error: 'Failed to check student deletability',
      message: 'An internal server error occurred'
    });
  }
};

async function checkActiveEnrollments(
  studentObjectId: string, 
  studentId: string
): Promise<{ hasActive: boolean; enrollments: any[] }> {
  try {
    const activeEnrollments = await Enrollment.find({
      $or: [
        { studentId: studentObjectId },
        { studentId: studentId }
      ],
      status: { $in: ['active', 'enrolled', 'in_progress'] },
    }).populate('courseId', 'name code');

    return {
      hasActive: activeEnrollments.length > 0,
      enrollments: activeEnrollments.map(enrollment => ({
        id: enrollment._id,
        courseId: enrollment.courseId,
        courseName: enrollment.courseId?.name,
        courseCode: enrollment.courseId?.code,
        status: enrollment.status,
        enrolledAt: enrollment.createdAt
      }))
    };
    // Option 2: If enrollments are stored in a courses collection
    /*
    const coursesWithStudent = await Course.find({
      'enrollments.studentId': { $in: [studentObjectId, studentId] },
      'enrollments.status': { $in: ['active', 'enrolled', 'in_progress'] }
    });

    const activeEnrollments = coursesWithStudent.flatMap(course => 
      course.enrollments
        .filter(enrollment => 
          (enrollment.studentId === studentObjectId || enrollment.studentId === studentId) &&
          ['active', 'enrolled', 'in_progress'].includes(enrollment.status)
        )
        .map(enrollment => ({
          courseId: course._id,
          courseName: course.name,
          courseCode: course.code,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt
        }))
    );

    return {
      hasActive: activeEnrollments.length > 0,
      enrollments: activeEnrollments
    };
    */

    // Option 3: Placeholder implementation - replace with your actual logic
    // For now, we'll assume no active enrollments to allow deletions
    // You should replace this with your actual enrollment checking logic
    
    console.log(`Checking enrollments for student ${studentId} (${studentObjectId})`);
    
    // TODO: Implement actual enrollment checking based on your data model
    // This is a placeholder that always returns no active enrollments
    return {
      hasActive: false,
      enrollments: []
    };

  } catch (error) {
    console.error('Error checking active enrollments:', error);
    return {
      hasActive: true,
      enrollments: [{ error: 'Could not verify enrollment status' }]
    };
  }
}