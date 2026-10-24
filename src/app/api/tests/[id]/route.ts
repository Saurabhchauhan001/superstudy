import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Test from '@/models/Test';
import Question from '@/models/Question';
import Subject from '@/models/Subject';
import TestAttempt from '@/models/TestAttempt';
import AttemptAnswer from '@/models/AttemptAnswer';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();
    const test = await Test.findById(id);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    const questions = await Question.find({ testId: id }).sort({ displayOrder: 1 });
    const subject = await Subject.findById(test.subjectId);
    const attempts = await TestAttempt.find({
      testId: id,
      status: { $in: ['submitted', 'timed-out'] },
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      test: {
        ...test.toObject(),
        subjectName: subject?.name,
        questionCount: questions.length,
        attemptCount: attempts.length,
        lastAttempt: attempts[0] || null,
      },
      questions,
    });
  } catch (error) {
    console.error('GET /api/tests/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch test' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();
    const body = await request.json();
    const { questions: questionsData, ...testData } = body;

    const test = await Test.findByIdAndUpdate(id, testData, {
      new: true,
      runValidators: true,
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Update questions: delete existing and recreate
    if (questionsData !== undefined) {
      await Question.deleteMany({ testId: id });
      if (questionsData.length > 0) {
        const questionDocs = questionsData.map((q: Record<string, unknown>, idx: number) => ({
          ...q,
          testId: test._id,
          displayOrder: typeof q.displayOrder === 'number' ? q.displayOrder : idx,
        }));
        await Question.insertMany(questionDocs);
      }
    }

    const questions = await Question.find({ testId: id }).sort({ displayOrder: 1 });
    return NextResponse.json({ test, questions });
  } catch (error) {
    console.error('PUT /api/tests/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update test' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();
    const test = await Test.findById(id);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    await Question.deleteMany({ testId: id });
    const attempts = await TestAttempt.find({ testId: id });
    for (const attempt of attempts) {
      await AttemptAnswer.deleteMany({ attemptId: attempt._id });
    }
    await TestAttempt.deleteMany({ testId: id });
    await Test.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/tests/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 });
  }
}
