import mongoose, { Document, Schema } from 'mongoose';

export interface IGrade {
  subject: string;
  score: number;
}

export interface IStudent extends Document {
  studentId: string; // Unique student ID
  name: string;
  email: string; // Added email field
  age: number;
  gradeLevel: string; // Changed from 'class' to 'gradeLevel' to match acceptance criteria
  grades: IGrade[];
  createdAt: Date;
  updatedAt: Date;
}

const GradeSchema: Schema = new Schema<IGrade>({
  subject: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  }
}, { _id: false });

const StudentSchema: Schema = new Schema<IStudent>({
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  age: {
    type: Number,
    required: true,
    min: [3, 'Age must be at least 3'],
    max: [25, 'Age must be less than 25']
  },
  gradeLevel: {
    type: String,
    required: true,
    trim: true
  },
  grades: {
    type: [GradeSchema],
    default: []
  }
}, {
  timestamps: true
});

// Generate unique student ID before saving
StudentSchema.pre('save', async function(next) {
  if (!this.studentId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Student').countDocuments();
    this.studentId = `STU-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model<IStudent>('Student', StudentSchema)