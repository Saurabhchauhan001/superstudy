import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Subject from '@/models/Subject';
import Test from '@/models/Test';
import Question from '@/models/Question';
import TestAttempt from '@/models/TestAttempt';
import AttemptAnswer from '@/models/AttemptAnswer';
import { SubjectSchema } from '@/lib/validations';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();
    const subject = await Subject.findById(id);
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const tests = await Test.find({ subjectId: id }).sort({ createdAt: -1 });
    const enrichedTests = await Promise.all(
      tests.map(async (test) => {
        const questionCount = await Question.countDocuments({ testId: test._id });
        const attempts = await TestAttempt.find({
          testId: test._id,
          status: { $in: ['submitted', 'timed-out'] },
        }).sort({ createdAt: -1 });

        return {
          ...test.toObject(),
          questionCount,
          attemptCount: attempts.length,
          lastAttempt: attempts[0] || null,
        };
      })
    );

    return NextResponse.json({ subject, tests: enrichedTests });
  } catch (error) {
    console.error('GET /api/subjects/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch subject' }, { status: 500 });
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
    const parsed = SubjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const subject = await Subject.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    });

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    return NextResponse.json({ subject });
  } catch (error) {
    console.error('PUT /api/subjects/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();
    const subject = await Subject.findById(id);
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    // Delete cascade: tests -> questions -> attempts -> attemptAnswers
    const tests = await Test.find({ subjectId: id });
    for (const test of tests) {
      await Question.deleteMany({ testId: test._id });
      const attempts = await TestAttempt.find({ testId: test._id });
      for (const attempt of attempts) {
        await AttemptAnswer.deleteMany({ attemptId: attempt._id });
      }
      await TestAttempt.deleteMany({ testId: test._id });
    }
    await Test.deleteMany({ subjectId: id });
    await Subject.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/subjects/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
}
