import mongoose, { Schema, Document } from 'mongoose';

export enum EnrollmentStatus {
  ACTIVE = 'active',
  ENROLLED = 'enrolled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
  WITHDRAWN = 'withdrawn',
  SUSPENDED = 'suspended',
  TRANSFERRED = 'transferred'
}

export enum GradeLevel {
  KINDERGARTEN = 'K',
  FIRST = '1',
  SECOND = '2',
  THIRD = '3',
  FOURTH = '4',
  FIFTH = '5',
  SIXTH = '6',
  SEVENTH = '7',
  EIGHTH = '8',
  NINTH = '9',
  TENTH = '10',
  ELEVENTH = '11',
  TWELFTH = '12',
  PRESCHOOL = 'PreK'
}

export interface IGradeInfo {
  midtermGrade?: string;
  finalGrade?: string;
  gpa?: number;
}

export interface IEnrollment extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  gradeLevel: GradeLevel;
  status: EnrollmentStatus;
  enrollmentDate: Date;
  completionDate?: Date;
  dropDate?: Date;
  academicGrade?: IGradeInfo; // Renamed from 'grade' to avoid confusion with gradeLevel
  credits: number;
  semester: string;
  academicYear: string;
  section?: string;
  instructor?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentGradeSchema = new Schema({
  midtermGrade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'I', 'W', 'P', 'NP'],
    default: null
  },
  finalGrade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'I', 'W', 'P', 'NP'],
    default: null
  },
  gpa: {
    type: Number,
    min: 0,
    max: 4.0,
    default: null
  }
}, { _id: false });

const EnrollmentSchema = new Schema<IEnrollment>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required'],
    index: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required'],
    index: true
  },
  gradeLevel: {
    type: String,
    enum: Object.values(GradeLevel),
    required: [true, 'Grade level is required'],
    index: true
  },
  status: {
    type: String,
    enum: Object.values(EnrollmentStatus),
    default: EnrollmentStatus.ENROLLED,
    required: [true, 'Enrollment status is required'],
    index: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now,
    required: [true, 'Enrollment date is required']
  },
  completionDate: {
    type: Date,
    default: null,
    validate: {
      validator: function(this: IEnrollment, value: Date) {
        return !value || value >= this.enrollmentDate;
      },
      message: 'Completion date must be after enrollment date'
    }
  },
  dropDate: {
    type: Date,
    default: null,
    validate: {
      validator: function(this: IEnrollment, value: Date) {
        return !value || value >= this.enrollmentDate;
      },
      message: 'Drop date must be after enrollment date'
    }
  },
  academicGrade: EnrollmentGradeSchema,
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: [0, 'Credits cannot be negative'],
    max: [10, 'Credits cannot exceed 10 per course']
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    enum: ['Fall', 'Spring', 'Summer', 'Winter'],
    index: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY (e.g., 2024-2025)'],
    index: true
  },
  section: {
    type: String,
    default: null,
    maxlength: [10, 'Section cannot exceed 10 characters']
  },
  instructor: {
    type: String,
    default: null,
    maxlength: [100, 'Instructor name cannot exceed 100 characters']
  },
  notes: {
    type: String,
    default: null,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'enrollments'
});

// Updated indexes to include gradeLevel
EnrollmentSchema.index({ studentId: 1, courseId: 1, gradeLevel: 1, semester: 1, academicYear: 1 }, { unique: true });
EnrollmentSchema.index({ studentId: 1, status: 1 });
EnrollmentSchema.index({ courseId: 1, status: 1 });
EnrollmentSchema.index({ gradeLevel: 1, status: 1 });
EnrollmentSchema.index({ gradeLevel: 1, academicYear: 1 });
EnrollmentSchema.index({ semester: 1, academicYear: 1 });
EnrollmentSchema.index({ status: 1, isActive: 1 });

EnrollmentSchema.virtual('isCurrentlyActive').get(function(this: IEnrollment) {
  const activeStatuses = [
    EnrollmentStatus.ACTIVE,
    EnrollmentStatus.ENROLLED,
    EnrollmentStatus.IN_PROGRESS
  ];
  return this.isActive && activeStatuses.includes(this.status);
});

EnrollmentSchema.virtual('enrollmentDuration').get(function(this: IEnrollment) {
  const endDate = this.completionDate || this.dropDate || new Date();
  const durationMs = endDate.getTime() - this.enrollmentDate.getTime();
  return Math.floor(durationMs / (1000 * 60 * 60 * 24)); // Duration in days
});

EnrollmentSchema.pre('save', function(this: IEnrollment, next) {
  if (this.status === EnrollmentStatus.COMPLETED && !this.completionDate) {
    this.completionDate = new Date();
  }

  if ([EnrollmentStatus.DROPPED, EnrollmentStatus.WITHDRAWN].includes(this.status) && !this.dropDate) {
    this.dropDate = new Date();
  }

  const inactiveStatuses = [
    EnrollmentStatus.COMPLETED,
    EnrollmentStatus.DROPPED,
    EnrollmentStatus.WITHDRAWN,
    EnrollmentStatus.TRANSFERRED
  ];
  if (inactiveStatuses.includes(this.status)) {
    this.isActive = false;
  }

  next();
});

// Updated static methods to include grade-based queries
EnrollmentSchema.statics.findActiveEnrollments = function(studentId?: string, courseId?: string, gradeLevel?: GradeLevel) {
  const query: any = {
    isActive: true,
    status: { $in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.ENROLLED, EnrollmentStatus.IN_PROGRESS] }
  };
  
  if (studentId) query.studentId = studentId;
  if (courseId) query.courseId = courseId;
  if (gradeLevel) query.gradeLevel = gradeLevel;
  
  return this.find(query);
};

EnrollmentSchema.statics.findByAcademicPeriod = function(semester: string, academicYear: string, gradeLevel?: GradeLevel) {
  const query: any = { semester, academicYear };
  if (gradeLevel) query.gradeLevel = gradeLevel;
  
  return this.find(query);
};

EnrollmentSchema.statics.findByGradeLevel = function(gradeLevel: GradeLevel, academicYear?: string, activeOnly: boolean = false) {
  const query: any = { gradeLevel };
  
  if (academicYear) query.academicYear = academicYear;
  
  if (activeOnly) {
    query.isActive = true;
    query.status = { $in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.ENROLLED, EnrollmentStatus.IN_PROGRESS] };
  }
  
  return this.find(query)
    .populate('studentId', 'name email studentId')
    .populate('courseId', 'name code credits description')
    .sort({ enrollmentDate: -1 });
};

EnrollmentSchema.statics.getStudentEnrollmentHistory = function(studentId: string) {
  return this.find({ studentId })
    .populate('courseId', 'name code credits description')
    .sort({ enrollmentDate: -1 });
};

EnrollmentSchema.statics.getCourseEnrollments = function(courseId: string, activeOnly: boolean = false, gradeLevel?: GradeLevel) {
  const query: any = { courseId };
  
  if (gradeLevel) query.gradeLevel = gradeLevel;
  
  if (activeOnly) {
    query.isActive = true;
    query.status = { $in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.ENROLLED, EnrollmentStatus.IN_PROGRESS] };
  }
  
  return this.find(query)
    .populate('studentId', 'name email studentId')
    .sort({ enrollmentDate: -1 });
};

EnrollmentSchema.statics.getGradeDistribution = function(gradeLevel: GradeLevel, academicYear?: string) {
  const match: any = { gradeLevel };
  if (academicYear) match.academicYear = academicYear;
  
  return this.aggregate([
    { $match: match },
    { $group: {
        _id: '$status',
        count: { $sum: 1 },
        students: { $addToSet: '$studentId' }
      }
    },
    { $project: {
        status: '$_id',
        count: 1,
        uniqueStudents: { $size: '$students' },
        _id: 0
      }
    }
  ]);
};

EnrollmentSchema.methods.markAsCompleted = function(this: IEnrollment, finalGrade?: string) {
  this.status = EnrollmentStatus.COMPLETED;
  this.completionDate = new Date();
  this.isActive = false;
  
  if (finalGrade) {
    if (!this.academicGrade) {
      this.academicGrade = {};
    }
    this.academicGrade.finalGrade = finalGrade;
  }
  
  return this.save();
};

EnrollmentSchema.methods.markAsDropped = function(this: IEnrollment, reason?: string) {
  this.status = EnrollmentStatus.DROPPED;
  this.dropDate = new Date();
  this.isActive = false;
  
  if (reason) {
    this.notes = this.notes ? `${this.notes}; Dropped: ${reason}` : `Dropped: ${reason}`;
  }
  
  return this.save();
};

EnrollmentSchema.methods.updateGrade = function(this: IEnrollment, gradeType: 'midterm' | 'final', grade: string, gpa?: number) {
  if (!this.academicGrade) {
    this.academicGrade = {};
  }
  
  if (gradeType === 'midterm') {
    this.academicGrade.midtermGrade = grade;
  } else {
    this.academicGrade.finalGrade = grade;
  }
  
  if (gpa !== undefined) {
    this.academicGrade.gpa = gpa;
  }
  
  return this.save();
};

EnrollmentSchema.methods.promoteToNextGrade = function(this: IEnrollment) {
  const gradeOrder = Object.values(GradeLevel);
  const currentIndex = gradeOrder.indexOf(this.gradeLevel);
  
  if (currentIndex < gradeOrder.length - 1) {
    this.gradeLevel = gradeOrder[currentIndex + 1] as GradeLevel;
    return this.save();
  } else {
    throw new Error('Student is already in the highest grade level');
  }
};

const Enrollment = mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);

export default Enrollment;