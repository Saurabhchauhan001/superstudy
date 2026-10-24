import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Subject from '@/models/Subject';
import Test from '@/models/Test';
import TestAttempt from '@/models/TestAttempt';
import { SubjectSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const subjects = await Subject.find().sort({ displayOrder: 1, createdAt: 1 });

    // Enrich with stats
    const enriched = await Promise.all(
      subjects.map(async (subject) => {
        const tests = await Test.find({ subjectId: subject._id });
        const testIds = tests.map((t) => t._id);
        const attempts = await TestAttempt.find({
          testId: { $in: testIds },
          status: { $in: ['submitted', 'timed-out'] },
        });

        const averageScore =
          attempts.length > 0
            ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length
            : 0;

        return {
          ...subject.toObject(),
          testCount: tests.length,
          attemptedCount: attempts.length,
          averageScore: Math.round(averageScore * 10) / 10,
        };
      })
    );

    return NextResponse.json({ subjects: enriched, dbConnected: true });
  } catch (error) {
    console.error('GET /api/subjects error:', error);
    return NextResponse.json({ subjects: [], dbConnected: false, error: (error as Error).message });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const parsed = SubjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const count = await Subject.countDocuments();
    const subject = await Subject.create({
      ...parsed.data,
      displayOrder: parsed.data.displayOrder ?? count,
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    console.error('POST /api/subjects error:', error);
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
  }
}
