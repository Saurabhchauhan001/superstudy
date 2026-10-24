import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Test from '@/models/Test';
import Question from '@/models/Question';
import Subject from '@/models/Subject';
import TestAttempt from '@/models/TestAttempt';
import { TestSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const status = searchParams.get('status');

    const filter: Record<string, unknown> = {};
    if (subjectId) filter.subjectId = subjectId;
    if (status) filter.status = status;

    const tests = await Test.find(filter).sort({ createdAt: -1 });

    const enriched = await Promise.all(
      tests.map(async (test) => {
        const questionCount = await Question.countDocuments({ testId: test._id });
        const subject = await Subject.findById(test.subjectId);
        const attempts = await TestAttempt.find({
          testId: test._id,
          status: { $in: ['submitted', 'timed-out'] },
        }).sort({ createdAt: -1 });

        return {
          ...test.toObject(),
          questionCount,
          subjectName: subject?.name,
          attemptCount: attempts.length,
          lastAttempt: attempts[0] || null,
        };
      })
    );

    return NextResponse.json({ tests: enriched, dbConnected: true });
  } catch (error) {
    console.error('GET /api/tests error:', error);
    return NextResponse.json({ tests: [], dbConnected: false, error: (error as Error).message });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { questions: questionsData, ...testData } = body;

    const parsed = TestSchema.safeParse({ ...testData, questions: questionsData });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const test = await Test.create(testData);

    let createdQuestions: unknown[] = [];
    if (questionsData && questionsData.length > 0) {
      const questionDocs = questionsData.map((q: Record<string, unknown>, idx: number) => ({
        ...q,
        testId: test._id,
        displayOrder: typeof q.displayOrder === 'number' ? q.displayOrder : idx,
      }));
      createdQuestions = await Question.insertMany(questionDocs);
    }

    return NextResponse.json(
      { test, questions: createdQuestions },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/tests error:', error);
    return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
  }
}
