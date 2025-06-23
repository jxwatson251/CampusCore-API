import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password: string;
  role: 'admin' | 'teacher'; // You can expand roles if needed
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
    enum: ['admin', 'teacher'],
    default: 'admin'
  }
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);