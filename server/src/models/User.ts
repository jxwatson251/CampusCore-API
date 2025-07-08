import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
  studentId?: string;
  createdAt: Date;
  updatedAt: Date;
  // Add method signatures to interface
  hasRole(role: string): boolean;
  isValidStudent(): boolean;
}

const UserSchema: Schema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [50, 'Username must be less than 50 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'teacher', 'student'],
      message: 'Role must be either admin, teacher, or student'
    },
    required: [true, 'Role is required']
  },
  studentId: {
    type: String,
    required: function(this: IUser) {
      return this.role === 'student';
    },
    unique: true,
    sparse: true, // Allows multiple documents to have undefined/null studentId
    trim: true,
    validate: {
      validator: function(this: IUser, value: string | undefined) {
        // Only validate if user is a student
        if (this.role === 'student') {
          return value != null && value.length > 0;
        }
        return true; // Non-students can have undefined studentId
      },
      message: 'Student ID is required for student role'
    }
  }
}, {
  timestamps: true
});

// Compound index for better query performance
UserSchema.index({ username: 1, role: 1 });
UserSchema.index({ studentId: 1 });

// Pre-save middleware to ensure studentId is only set for students
UserSchema.pre('save', function(this: IUser, next) {
  // Remove studentId if user is not a student
  if (this.role !== 'student') {
    this.studentId = undefined;
  }
  next();
});

// Method to check if user has a specific role
UserSchema.methods.hasRole = function(this: IUser, role: string): boolean {
  return this.role === role;
};

// Method to check if user is a student with valid studentId
UserSchema.methods.isValidStudent = function(this: IUser): boolean {
  return this.role === 'student' && !!this.studentId;
};

export default mongoose.model<IUser>('User', UserSchema);