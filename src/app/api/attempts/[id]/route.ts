import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import TestAttempt from '@/models/TestAttempt';
import AttemptAnswer from '@/models/AttemptAnswer';
import Question from '@/models/Question';
import Test from '@/models/Test';
import Subject from '@/models/Subject';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();
    const attempt = await TestAttempt.findById(id);
    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    const test = await Test.findById(attempt.testId);
    const subject = test ? await Subject.findById(test.subjectId) : null;

    // Fetch answers with question details
    const answers = await AttemptAnswer.find({ attemptId: id });
    const questionsWithAnswers = await Promise.all(
      answers.map(async (answer) => {
        const question = await Question.findById(answer.questionId);
        return {
          ...answer.toObject(),
          question: question ? question.toObject() : null,
        };
      })
    );

    return NextResponse.json({
      attempt: {
        ...attempt.toObject(),
        test: test
          ? { ...test.toObject(), subjectName: subject?.name }
          : null,
      },
      answers: questionsWithAnswers,
    });
  } catch (error) {
    console.error('GET /api/attempts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch attempt' }, { status: 500 });
  }
}

// Submit attempt (server-side scoring)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();
    const attempt = await TestAttempt.findById(id);
    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }
    if (attempt.status !== 'in-progress') {
      return NextResponse.json({ error: 'Attempt already submitted' }, { status: 400 });
    }

    const body = await request.json();
    const { answers: submittedAnswers, timeTakenSeconds, isTimedOut } = body;

    const test = await Test.findById(attempt.testId);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    const questions = await Question.find({ testId: attempt.testId });

    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let attemptedQuestions = 0;
    let marksObtained = 0;

    const answerDocs = [];

    for (const q of questions) {
      const qId = q._id.toString();
      const submission = submittedAnswers?.[qId];
      const selectedAnswer = submission?.selectedAnswer;
      const markedForReview = submission?.markedForReview ?? false;

      const correctMark = q.marks ?? test.correctMarks;
      const negativeMark = q.negativeMarks ?? test.negativeMarks;

      let isCorrect: boolean | undefined;
      let marksAwarded = 0;

      if (selectedAnswer) {
        attemptedQuestions++;
        isCorrect = selectedAnswer === q.correctAnswer;
        if (isCorrect) {
          correctAnswers++;
          marksAwarded = correctMark;
          marksObtained += correctMark;
        } else {
          incorrectAnswers++;
          marksAwarded = -negativeMark;
          marksObtained -= negativeMark;
        }
      }

      answerDocs.push({
        attemptId: attempt._id,
        questionId: q._id,
        selectedAnswer: selectedAnswer || undefined,
        isCorrect,
        marksAwarded,
        markedForReview,
      });
    }

    // Delete any existing answer docs (re-submit protection)
    await AttemptAnswer.deleteMany({ attemptId: attempt._id });
    await AttemptAnswer.insertMany(answerDocs);

    const unansweredQuestions = questions.length - attemptedQuestions;
    const percentage =
      attempt.maximumMarks > 0
        ? Math.round((marksObtained / attempt.maximumMarks) * 1000) / 10
        : 0;
    const accuracy =
      attemptedQuestions > 0
        ? Math.round((correctAnswers / attemptedQuestions) * 1000) / 10
        : 0;

    const updatedAttempt = await TestAttempt.findByIdAndUpdate(
      id,
      {
        status: isTimedOut ? 'timed-out' : 'submitted',
        submittedAt: new Date(),
        timeTakenSeconds,
        attemptedQuestions,
        correctAnswers,
        incorrectAnswers,
        unansweredQuestions,
        marksObtained: Math.max(0, marksObtained),
        percentage: Math.max(0, percentage),
        accuracy,
      },
      { new: true }
    );

    return NextResponse.json({ attempt: updatedAttempt });
  } catch (error) {
    console.error('POST /api/attempts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to submit attempt' }, { status: 500 });
  }
}
