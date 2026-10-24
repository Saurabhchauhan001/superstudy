'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart2, Target, CheckCircle2, XCircle, Clock, TrendingUp, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { OverallAnalytics } from '@/types';

export const dynamic = 'force-dynamic';
import { cn, formatTime, formatDateTime, getScoreColor } from '@/lib/utils';
import StatsCard from '@/components/dashboard/StatsCard';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<OverallAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => setAnalytics(d.analytics))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
  );

  if (!analytics || analytics.totalTestsAttempted === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Data Yet</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm">
        Complete at least one test to see your performance analytics here.
      </p>
    </div>
  );

  const pieData = [
    { name: 'Correct', value: analytics.totalCorrect, color: '#10b981' },
    { name: 'Incorrect', value: analytics.totalIncorrect, color: '#f43f5e' },
  ];

  const insights: string[] = [];
  const sorted = [...(analytics.subjectAnalytics ?? [])].sort((a, b) => b.averagePercentage - a.averagePercentage);
  if (sorted.length > 0) {
    insights.push(`🏆 Best subject: ${sorted[0].subjectName} (${sorted[0].averagePercentage}% avg)`);
    if (sorted.length > 1) {
      insights.push(`📚 Needs practice: ${sorted[sorted.length - 1].subjectName} (${sorted[sorted.length - 1].averagePercentage}% avg)`);
    }
    const highAcc = sorted.find((s) => s.averageAccuracy > 70);
    if (highAcc) insights.push(`🎯 High accuracy: ${highAcc.subjectName} (${highAcc.averageAccuracy}% accuracy)`);
  }
  if (analytics.averageScore >= 80) insights.push('⭐ Excellent overall performance! Keep it up.');
  else if (analytics.averageScore < 50) insights.push('📈 Focus on fundamentals to improve your average score.');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Performance Analytics</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Based on {analytics.totalTestsAttempted} completed test{analytics.totalTestsAttempted !== 1 ? 's' : ''}</p>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Tests Attempted" value={analytics.totalTestsAttempted} icon={BarChart2} color="indigo" />
        <StatsCard title="Average Score" value={`${analytics.averageScore}%`} icon={TrendingUp} color="emerald" />
        <StatsCard title="Overall Accuracy" value={`${analytics.overallAccuracy}%`} icon={Target} color="amber" />
        <StatsCard title="Highest Score" value={`${analytics.highestScore}%`} icon={CheckCircle2} color="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score trend */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Score Trend</h2>
          {analytics.scoreTrend.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analytics.scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={(v) => (v ? new Date(String(v)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '')} tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${v}%`, 'Score']} labelFormatter={(v: any) => (v ? new Date(String(v)).toLocaleDateString() : '')} />
                <Line type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-sm text-center py-10">Need at least 2 attempts for trend</p>
          )}
        </div>

        {/* Correct vs Incorrect */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Answer Breakdown</h2>
          <div className="flex items-center gap-6">
            <div className="w-44 h-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 className="w-4 h-4" />Correct</span>
                  <span className="font-bold">{analytics.totalCorrect}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(analytics.totalCorrect / analytics.totalQuestionsAttempted) * 100}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1.5 text-rose-600"><XCircle className="w-4 h-4" />Incorrect</span>
                  <span className="font-bold">{analytics.totalIncorrect}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full"><div className="h-full bg-rose-500 rounded-full" style={{ width: `${(analytics.totalIncorrect / analytics.totalQuestionsAttempted) * 100}%` }} /></div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">Total: {analytics.totalQuestionsAttempted} answered<br />Time: {formatTime(analytics.totalTimeSeconds)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subject-wise bar chart */}
      {analytics.subjectAnalytics && analytics.subjectAnalytics.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Subject-wise Average Score</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.subjectAnalytics} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="subjectName" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} interval={0} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}%`, 'Avg Score']} />
              <Bar dataKey="averagePercentage" fill="#6366f1" radius={[4, 4, 0, 0]} name="Avg Score %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Subject cards */}
      {analytics.subjectAnalytics && analytics.subjectAnalytics.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Subject Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.subjectAnalytics.map((sub) => (
              <div key={sub.subjectId} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{sub.icon ?? '📚'}</span>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{sub.subjectName}</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div><span>Tests:</span> <span className="font-bold text-slate-900 dark:text-white">{sub.testsAttempted}</span></div>
                  <div><span>Avg:</span> <span className={cn('font-bold', getScoreColor(sub.averagePercentage))}>{sub.averagePercentage}%</span></div>
                  <div><span>Best:</span> <span className={cn('font-bold', getScoreColor(sub.highestPercentage))}>{sub.highestPercentage}%</span></div>
                  <div><span>Accuracy:</span> <span className="font-bold text-slate-900 dark:text-white">{sub.averageAccuracy}%</span></div>
                  <div><span>Correct:</span> <span className="font-bold text-emerald-600">{sub.correctAnswers}</span></div>
                  <div><span>Wrong:</span> <span className="font-bold text-rose-600">{sub.incorrectAnswers}</span></div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Score</span><span>{sub.averagePercentage}%</span></div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(sub.averagePercentage, 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-5">
          <h2 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-3">💡 Insights</h2>
          <ul className="space-y-2">
            {insights.map((insight, i) => (
              <li key={i} className="text-sm text-indigo-800 dark:text-indigo-300">{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent attempts */}
      {analytics.recentAttempts.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Recent Tests</h2>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left p-4 font-medium text-slate-500 dark:text-slate-400">Test</th>
                  <th className="text-left p-4 font-medium text-slate-500 dark:text-slate-400 hidden sm:table-cell">Date</th>
                  <th className="text-center p-4 font-medium text-slate-500 dark:text-slate-400">Score</th>
                  <th className="text-center p-4 font-medium text-slate-500 dark:text-slate-400 hidden md:table-cell">Accuracy</th>
                  <th className="text-center p-4 font-medium text-slate-500 dark:text-slate-400 hidden md:table-cell">Time</th>
                  <th className="text-right p-4 font-medium text-slate-500 dark:text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentAttempts.map((a) => {
                  const t = a.test;
                  return (
                    <tr key={a._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <Link href={`/attempts/${a._id}`} className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors">
                          {t?.title ?? 'Unknown'}
                        </Link>
                        <p className="text-xs text-slate-500">{t?.subjectName ?? ''}</p>
                      </td>
                      <td className="p-4 text-slate-500 hidden sm:table-cell">{formatDateTime(a.startedAt)}</td>
                      <td className="p-4 text-center"><span className={cn('font-bold', getScoreColor(a.percentage))}>{a.percentage}%</span></td>
                      <td className="p-4 text-center text-slate-700 dark:text-slate-300 hidden md:table-cell">{a.accuracy}%</td>
                      <td className="p-4 text-center text-slate-500 hidden md:table-cell">{formatTime(a.timeTakenSeconds ?? 0)}</td>
                      <td className="p-4 text-right">
                        <Link href={`/attempts/${a._id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                          Review &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
