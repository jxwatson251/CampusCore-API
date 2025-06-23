import mongoose, { Document, Schema } from 'mongoose';

export interface IGrade {
  subject: string;
  score: number;
}

export interface IStudent extends Document {
  name: string;
  age: number;
  class: string;
  grades: IGrade[];
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
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true
  },
  class: {
    type: String,
    required: true
  },
  grades: {
    type: [GradeSchema],
    default: []
  }
}, {
  timestamps: true
});

export default mongoose.model<IStudent>('Student', StudentSchema)