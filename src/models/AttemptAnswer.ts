import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAttemptAnswer extends Document {
  attemptId: Types.ObjectId;
  questionId: Types.ObjectId;
  selectedAnswer?: string; // option id, undefined if not answered
  isCorrect?: boolean;
  marksAwarded: number;
  markedForReview: boolean;
  timeSpentSeconds?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttemptAnswerSchema = new Schema<IAttemptAnswer>(
  {
    attemptId: { type: Schema.Types.ObjectId, ref: 'TestAttempt', required: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedAnswer: { type: String },
    isCorrect: { type: Boolean },
    marksAwarded: { type: Number, default: 0 },
    markedForReview: { type: Boolean, default: false },
    timeSpentSeconds: { type: Number },
  },
  { timestamps: true }
);

AttemptAnswerSchema.index({ attemptId: 1 });
AttemptAnswerSchema.index({ attemptId: 1, questionId: 1 });

const AttemptAnswer: Model<IAttemptAnswer> =
  mongoose.models.AttemptAnswer ||
  mongoose.model<IAttemptAnswer>('AttemptAnswer', AttemptAnswerSchema);

export default AttemptAnswer;
