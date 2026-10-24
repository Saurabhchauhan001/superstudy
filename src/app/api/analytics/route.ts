import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import TestAttempt from '@/models/TestAttempt';
import Test from '@/models/Test';
import Subject from '@/models/Subject';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    await connectDB();

    const submittedAttempts = await TestAttempt.find({
      status: { $in: ['submitted', 'timed-out'] },
    }).sort({ startedAt: -1 });

    if (submittedAttempts.length === 0) {
      return NextResponse.json({
        analytics: {
          totalTestsAttempted: 0,
          averageScore: 0,
          overallAccuracy: 0,
          totalQuestionsAttempted: 0,
          totalCorrect: 0,
          totalIncorrect: 0,
          totalTimeSeconds: 0,
          highestScore: 0,
          recentAttempts: [],
          subjectAnalytics: [],
          scoreTrend: [],
        },
      });
    }

    // Overall stats
    const totalTestsAttempted = submittedAttempts.length;
    const totalCorrect = submittedAttempts.reduce((s, a) => s + a.correctAnswers, 0);
    const totalIncorrect = submittedAttempts.reduce((s, a) => s + a.incorrectAnswers, 0);
    const totalQuestionsAttempted = submittedAttempts.reduce(
      (s, a) => s + a.attemptedQuestions,
      0
    );
    const totalTimeSeconds = submittedAttempts.reduce(
      (s, a) => s + (a.timeTakenSeconds ?? 0),
      0
    );
    const averageScore =
      submittedAttempts.reduce((s, a) => s + a.percentage, 0) / totalTestsAttempted;
    const overallAccuracy =
      totalQuestionsAttempted > 0
        ? (totalCorrect / totalQuestionsAttempted) * 100
        : 0;
    const highestScore = Math.max(...submittedAttempts.map((a) => a.percentage));

    // Enrich recent attempts with test and subject details
    const recentAttempts = await Promise.all(
      submittedAttempts.slice(0, 10).map(async (attempt) => {
        const test = await Test.findById(attempt.testId);
        const subject = test ? await Subject.findById(test.subjectId) : null;
        return {
          ...attempt.toObject(),
          test: test
            ? {
                ...test.toObject(),
                subjectName: subject?.name,
              }
            : null,
        };
      })
    );

    // Subject-wise analytics
    const subjects = await Subject.find();
    const subjectAnalytics = await Promise.all(
      subjects.map(async (subject) => {
        const tests = await Test.find({ subjectId: subject._id });
        const testIds = tests.map((t) => t._id);

        const subjectAttempts = submittedAttempts.filter((a) =>
          testIds.some((id) => id.toString() === a.testId.toString())
        );

        if (subjectAttempts.length === 0) return null;

        const subCorrect = subjectAttempts.reduce((s, a) => s + a.correctAnswers, 0);
        const subIncorrect = subjectAttempts.reduce((s, a) => s + a.incorrectAnswers, 0);
        const subAnswered = subCorrect + subIncorrect;
        const subTime = subjectAttempts.reduce((s, a) => s + (a.timeTakenSeconds ?? 0), 0);
        const avgPercentage =
          subjectAttempts.reduce((s, a) => s + a.percentage, 0) / subjectAttempts.length;
        const highestPercentage = Math.max(...subjectAttempts.map((a) => a.percentage));
        const avgAccuracy = subAnswered > 0 ? (subCorrect / subAnswered) * 100 : 0;

        return {
          subjectId: subject._id.toString(),
          subjectName: subject.name,
          icon: subject.icon,
          testsAttempted: subjectAttempts.length,
          averagePercentage: Math.round(avgPercentage * 10) / 10,
          highestPercentage,
          averageAccuracy: Math.round(avgAccuracy * 10) / 10,
          totalQuestionsAnswered: subAnswered,
          correctAnswers: subCorrect,
          incorrectAnswers: subIncorrect,
          totalTimeSeconds: subTime,
        };
      })
    );

    // Score trend (last 10 chronologically)
    const chronological = [...submittedAttempts].reverse().slice(-15);
    const scoreTrend = await Promise.all(
      chronological.map(async (attempt) => {
        const test = await Test.findById(attempt.testId);
        return {
          date: attempt.startedAt.toISOString().slice(0, 10),
          percentage: attempt.percentage,
          testTitle: test?.title ?? 'Test',
        };
      })
    );

    return NextResponse.json({
      analytics: {
        totalTestsAttempted,
        averageScore: Math.round(averageScore * 10) / 10,
        overallAccuracy: Math.round(overallAccuracy * 10) / 10,
        totalQuestionsAttempted,
        totalCorrect,
        totalIncorrect,
        totalTimeSeconds,
        highestScore,
        recentAttempts,
        subjectAnalytics: subjectAnalytics.filter(Boolean),
        scoreTrend,
      },
    });
  } catch (error) {
    console.error('GET /api/analytics error:', error);
    return NextResponse.json({
      analytics: {
        totalTestsAttempted: 0,
        averageScore: 0,
        overallAccuracy: 0,
        totalQuestionsAttempted: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalTimeSeconds: 0,
        highestScore: 0,
        recentAttempts: [],
        subjectAnalytics: [],
        scoreTrend: [],
      },
      dbConnected: false,
      message: 'MongoDB is not connected yet.',
    });
  }
}
