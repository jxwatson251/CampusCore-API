import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
  studentId?: string;
}

const UserSchema: Schema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    default: 'admin'
  },
  studentId: {
    type: String,
    ref: 'Student',
    required: function(this: IUser) {
      return this.role === 'student';
    },
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

UserSchema.index({ studentId: 1 });

export default mongoose.model<IUser>('User', UserSchema)