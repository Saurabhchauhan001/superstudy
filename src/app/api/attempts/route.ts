import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Test from '@/models/Test';
import Question from '@/models/Question';
import TestAttempt from '@/models/TestAttempt';
import AttemptAnswer from '@/models/AttemptAnswer';

export const dynamic = 'force-dynamic';

// Start a test attempt
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { testId } = body;

    const test = await Test.findById(testId);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }
    if (test.status !== 'published') {
      return NextResponse.json({ error: 'Test is not published' }, { status: 400 });
    }

    const questions = await Question.find({ testId }).sort({ displayOrder: 1 });
    if (questions.length === 0) {
      return NextResponse.json({ error: 'Test has no questions' }, { status: 400 });
    }

    // Build question order (shuffle if needed)
    let questionOrder = questions.map((q) => q._id.toString());
    if (test.questionOrderMode === 'random') {
      questionOrder = questionOrder.sort(() => Math.random() - 0.5);
    }

    // Build option orders if needed
    const optionOrders: Record<string, string[]> = {};
    if (test.optionOrderMode === 'random') {
      for (const q of questions) {
        const shuffled = [...q.options.map((o) => o.id)].sort(() => Math.random() - 0.5);
        optionOrders[q._id.toString()] = shuffled;
      }
    }

    const attempt = await TestAttempt.create({
      testId,
      startedAt: new Date(),
      status: 'in-progress',
      totalQuestions: questions.length,
      attemptedQuestions: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      unansweredQuestions: questions.length,
      marksObtained: 0,
      maximumMarks: questions.reduce(
        (sum, q) => sum + (q.marks ?? test.correctMarks),
        0
      ),
      percentage: 0,
      accuracy: 0,
      questionOrder,
      optionOrders: Object.keys(optionOrders).length > 0 ? optionOrders : undefined,
    });

    // Return questions WITHOUT correct answers
    const safeQuestions = questionOrder.map((qId) => {
      const q = questions.find((qq) => qq._id.toString() === qId)!;
      const opts = optionOrders[qId]
        ? optionOrders[qId].map((optId) => q.options.find((o) => o.id === optId)!)
        : q.options;
      return {
        _id: q._id,
        questionText: q.questionText,
        imageUrl: q.imageUrl,
        options: opts,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        displayOrder: q.displayOrder,
      };
    });

    return NextResponse.json({ attempt, questions: safeQuestions }, { status: 201 });
  } catch (error) {
    console.error('POST /api/attempts error:', error);
    return NextResponse.json({ error: 'Failed to start attempt' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');

    const filter: Record<string, unknown> = {};
    if (testId) filter.testId = testId;

    const attempts = await TestAttempt.find(filter).sort({ createdAt: -1 });
    return NextResponse.json({ attempts });
  } catch (error) {
    console.error('GET /api/attempts error:', error);
    return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 });
  }
}
