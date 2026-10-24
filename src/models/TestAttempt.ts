import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type AttemptStatus = 'in-progress' | 'submitted' | 'timed-out';

export interface ITestAttempt extends Document {
  testId: Types.ObjectId;
  startedAt: Date;
  submittedAt?: Date;
  timeTakenSeconds?: number;
  status: AttemptStatus;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  marksObtained: number;
  maximumMarks: number;
  percentage: number;
  accuracy: number;
  questionOrder: string[]; // ordered question IDs (snapshot for randomized tests)
  optionOrders?: Record<string, string[]>; // questionId -> shuffled option ids
  createdAt: Date;
  updatedAt: Date;
}

const TestAttemptSchema = new Schema<ITestAttempt>(
  {
    testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    timeTakenSeconds: { type: Number },
    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'timed-out'],
      default: 'in-progress',
    },
    totalQuestions: { type: Number, default: 0 },
    attemptedQuestions: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    incorrectAnswers: { type: Number, default: 0 },
    unansweredQuestions: { type: Number, default: 0 },
    marksObtained: { type: Number, default: 0 },
    maximumMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    questionOrder: [{ type: String }],
    optionOrders: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

TestAttemptSchema.index({ testId: 1 });
TestAttemptSchema.index({ status: 1 });
TestAttemptSchema.index({ startedAt: -1 });

const TestAttempt: Model<ITestAttempt> =
  mongoose.models.TestAttempt ||
  mongoose.model<ITestAttempt>('TestAttempt', TestAttemptSchema);

export default TestAttempt;
