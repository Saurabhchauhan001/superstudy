'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, Flag, ChevronDown, ChevronUp, BarChart2, Clock, Target, Loader2 } from 'lucide-react';
import { TestAttempt, AttemptAnswer } from '@/types';
import { cn, formatTime, formatDateTime, getScoreColor } from '@/lib/utils';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';

type Filter = 'all' | 'correct' | 'incorrect' | 'unanswered' | 'marked';

export const dynamic = 'force-dynamic';

export default function AttemptResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = use(params);
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [answers, setAnswers] = useState<AttemptAnswer[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/attempts/${attemptId}`)
      .then((r) => r.json())
      .then((d) => { setAttempt(d.attempt); setAnswers(d.answers || []); })
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  if (!attempt) return <p className="text-center py-20 text-slate-500">Attempt not found</p>;

  const test = attempt.test;

  const pieData = [
    { name: 'Correct', value: attempt.correctAnswers, color: '#10b981' },
    { name: 'Incorrect', value: attempt.incorrectAnswers, color: '#f43f5e' },
    { name: 'Unanswered', value: attempt.unansweredQuestions, color: '#94a3b8' },
  ].filter((d) => d.value > 0);

  const filteredAnswers = answers.filter((a) => {
    if (filter === 'correct') return a.isCorrect === true;
    if (filter === 'incorrect') return a.isCorrect === false;
    if (filter === 'unanswered') return !a.selectedAnswer;
    if (filter === 'marked') return a.markedForReview;
    return true;
  });

  function toggleExpand(id: string) {
    setExpandedQ((prev) => {
      const s = new Set(prev);
      if (s.has(id)) {
        s.delete(id);
      } else {
        s.add(id);
      }
      return s;
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={test?.subjectId ? `/subjects/${test.subjectId}` : '/'} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Exam Result</h1>
          <p className="text-sm text-slate-500">{test?.title ?? 'Test'} • {formatDateTime(attempt.startedAt)}</p>
        </div>
      </div>

      {/* Score card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Donut */}
          <div className="w-36 h-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: any, name: any) => [`${v}`, String(name)]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Score */}
          <div className="flex-1 text-center sm:text-left">
            <p className={cn('text-6xl font-black', getScoreColor(attempt.percentage))}>
              {attempt.percentage}%
            </p>
            <p className="text-slate-500 mt-1">
              {attempt.marksObtained} / {attempt.maximumMarks} marks
            </p>
            <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 className="w-4 h-4" />{attempt.correctAnswers} Correct</span>
              <span className="flex items-center gap-1.5 text-rose-600"><XCircle className="w-4 h-4" />{attempt.incorrectAnswers} Incorrect</span>
              <span className="flex items-center gap-1.5 text-slate-500"><MinusCircle className="w-4 h-4" />{attempt.unansweredQuestions} Skipped</span>
            </div>
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
          {[
            { icon: Target, label: 'Accuracy', value: `${attempt.accuracy}%`, color: 'text-indigo-600' },
            { icon: Clock, label: 'Time Taken', value: formatTime(attempt.timeTakenSeconds ?? 0), color: 'text-amber-600' },
            { icon: BarChart2, label: 'Attempted', value: `${attempt.attemptedQuestions}/${attempt.totalQuestions}`, color: 'text-violet-600' },
            { icon: CheckCircle2, label: 'Status', value: attempt.status === 'timed-out' ? 'Timed Out' : 'Submitted', color: attempt.status === 'timed-out' ? 'text-rose-600' : 'text-emerald-600' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center">
              <Icon className={cn('w-5 h-5 mx-auto mb-1', color)} />
              <p className="text-xs text-slate-500">{label}</p>
              <p className={cn('font-bold text-sm mt-0.5', color)}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Q-by-Q Review */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-slate-900 dark:text-white">Question Review & Explanations</h2>
          <div className="flex flex-wrap gap-1">
            {(['all', 'correct', 'incorrect', 'unanswered', 'marked'] as Filter[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors',
                  filter === f ? 'bg-indigo-600 text-white' : 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800')}>
                {f} {f === 'all' ? `(${answers.length})` : f === 'correct' ? `(${attempt.correctAnswers})` : f === 'incorrect' ? `(${attempt.incorrectAnswers})` : f === 'unanswered' ? `(${attempt.unansweredQuestions})` : `(${answers.filter((a) => a.markedForReview).length})`}
              </button>
            ))}
          </div>
        </div>

        {filteredAnswers.length === 0 ? (
          <div className="text-center py-10 text-slate-400">No questions in this filter</div>
        ) : (
          filteredAnswers.map((ans, idx) => {
            const q = ans.question;
            if (!q) return null;
            const expanded = expandedQ.has(ans._id);
            const options = q.options;

            return (
              <div key={ans._id} className={cn('bg-white dark:bg-slate-900 rounded-xl border-2 transition-colors',
                ans.isCorrect === true ? 'border-emerald-200 dark:border-emerald-800'
                : ans.isCorrect === false ? 'border-rose-200 dark:border-rose-800'
                : 'border-slate-200 dark:border-slate-700')}>
                <button className="w-full flex items-start gap-3 p-4 text-left" onClick={() => toggleExpand(ans._id)}>
                  <div className="mt-0.5 shrink-0">
                    {ans.isCorrect === true ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    : ans.isCorrect === false ? <XCircle className="w-5 h-5 text-rose-500" />
                    : <MinusCircle className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-500">Q{idx + 1}</span>
                      {ans.markedForReview && <Flag className="w-3.5 h-3.5 text-violet-500" />}
                      <span className={cn('text-xs font-semibold ml-auto', ans.marksAwarded > 0 ? 'text-emerald-600' : ans.marksAwarded < 0 ? 'text-rose-600' : 'text-slate-400')}>
                        {ans.marksAwarded > 0 ? `+${ans.marksAwarded}` : ans.marksAwarded} marks
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 line-clamp-2">{q.questionText}</p>
                  </div>
                  {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-1" />}
                </button>

                {expanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {Boolean(q.imageUrl) && (
                      <div className="mt-1">
                        <img src={q.imageUrl} alt="Question Diagram" className="max-h-60 rounded-lg border border-slate-200 dark:border-slate-700 object-contain bg-slate-50 dark:bg-slate-950 p-1" />
                      </div>
                    )}
                    <div className="space-y-2">
                      {options?.map((opt) => {
                        const isCorrect = opt.id === q.correctAnswer;
                        const isSelected = opt.id === ans.selectedAnswer;
                        return (
                          <div key={opt.id} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                            isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 font-semibold'
                            : isSelected && !isCorrect ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300 line-through'
                            : 'text-slate-600 dark:text-slate-400')}>
                            <span className="font-bold w-5">{opt.id}.</span>
                            <span>{opt.text}</span>
                            {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />}
                            {isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-500 ml-auto shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                    {Boolean(q.explanation) && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg text-sm text-amber-800 dark:text-amber-300">
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Back to subject */}
      {test?.subjectId && (
        <div className="flex justify-center pt-4">
          <Link href={`/subjects/${test.subjectId}`}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            Back to Subject
          </Link>
        </div>
      )}
    </div>
  );
}
