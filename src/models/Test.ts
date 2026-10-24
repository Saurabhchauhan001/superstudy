import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Mixed';
export type TestStatus = 'draft' | 'published';
export type OrderMode = 'fixed' | 'random';

export interface ITest extends Document {
  subjectId: Types.ObjectId;
  title: string;
  description?: string;
  subtopic?: string;
  difficulty: Difficulty;
  durationMinutes: number;
  correctMarks: number;
  negativeMarks: number;
  questionOrderMode: OrderMode;
  optionOrderMode: OrderMode;
  instructions?: string;
  status: TestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const TestSchema = new Schema<ITest>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    subtopic: { type: String, trim: true },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Mixed'],
      default: 'Medium',
    },
    durationMinutes: { type: Number, required: true, min: 1 },
    correctMarks: { type: Number, default: 1 },
    negativeMarks: { type: Number, default: 0 },
    questionOrderMode: {
      type: String,
      enum: ['fixed', 'random'],
      default: 'fixed',
    },
    optionOrderMode: {
      type: String,
      enum: ['fixed', 'random'],
      default: 'fixed',
    },
    instructions: { type: String },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: true }
);

TestSchema.index({ subjectId: 1 });
TestSchema.index({ status: 1 });

const Test: Model<ITest> =
  mongoose.models.Test || mongoose.model<ITest>('Test', TestSchema);

export default Test;
