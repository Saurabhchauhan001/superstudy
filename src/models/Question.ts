import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IOption {
  id: string;
  text: string;
}

export interface IQuestion extends Document {
  testId: Types.ObjectId;
  questionText: string;
  imageUrl?: string;
  imagePublicId?: string;
  options: IOption[];
  correctAnswer: string; // option id
  explanation?: string;
  marks?: number;
  negativeMarks?: number;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const OptionSchema = new Schema<IOption>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const QuestionSchema = new Schema<IQuestion>(
  {
    testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
    questionText: { type: String, required: true },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    options: { type: [OptionSchema], required: true },
    correctAnswer: { type: String, required: true },
    explanation: { type: String },
    marks: { type: Number },
    negativeMarks: { type: Number },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

QuestionSchema.index({ testId: 1, displayOrder: 1 });

const Question: Model<IQuestion> =
  mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);

export default Question;
