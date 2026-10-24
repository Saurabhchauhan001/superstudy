// Shared TypeScript types for the entire application

export interface Subject {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  topics?: string[];
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  // Computed
  testCount?: number;
  attemptedCount?: number;
  averageScore?: number;
}

export interface Test {
  _id: string;
  subjectId: string;
  subjectName?: string;
  title: string;
  description?: string;
  subtopic?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  durationMinutes: number;
  correctMarks: number;
  negativeMarks: number;
  questionOrderMode: 'fixed' | 'random';
  optionOrderMode: 'fixed' | 'random';
  instructions?: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  // Computed
  questionCount?: number;
  attemptCount?: number;
  lastAttempt?: TestAttempt;
}

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  _id: string;
  testId: string;
  questionText: string;
  imageUrl?: string;
  imagePublicId?: string;
  options: Option[];
  correctAnswer: string;
  explanation?: string;
  marks?: number;
  negativeMarks?: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TestAttempt {
  _id: string;
  testId: string;
  test?: Test;
  startedAt: string;
  submittedAt?: string;
  timeTakenSeconds?: number;
  status: 'in-progress' | 'submitted' | 'timed-out';
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  marksObtained: number;
  maximumMarks: number;
  percentage: number;
  accuracy: number;
  questionOrder: string[];
  optionOrders?: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
}

export interface AttemptAnswer {
  _id: string;
  attemptId: string;
  questionId: string;
  question?: Question;
  selectedAnswer?: string;
  isCorrect?: boolean;
  marksAwarded: number;
  markedForReview: boolean;
  timeSpentSeconds?: number;
}

// Analytics
export interface SubjectAnalytics {
  subjectId: string;
  subjectName: string;
  icon?: string;
  testsAttempted: number;
  averagePercentage: number;
  highestPercentage: number;
  averageAccuracy: number;
  totalQuestionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalTimeSeconds: number;
}

export interface OverallAnalytics {
  totalTestsAttempted: number;
  averageScore: number;
  overallAccuracy: number;
  totalQuestionsAttempted: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalTimeSeconds: number;
  highestScore: number;
  recentAttempts: TestAttempt[];
  subjectAnalytics: SubjectAnalytics[];
  scoreTrend: { date: string; percentage: number; testTitle: string }[];
}
