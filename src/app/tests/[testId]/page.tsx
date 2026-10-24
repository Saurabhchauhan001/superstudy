'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Play, Clock, HelpCircle, BarChart2, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Test, Question } from '@/types';
import { toast } from '@/components/ui/Toaster';
import { cn, getDifficultyColor } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function TestDetailPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = use(params);
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tests/${testId}`)
      .then((r) => r.json())
      .then((d) => { setTest(d.test); setQuestions(d.questions || []); })
      .finally(() => setLoading(false));
  }, [testId]);

  async function handleDelete() {
    if (!confirm('Delete this test? All attempt history will be permanently deleted.')) return;
    try {
      await fetch(`/api/tests/${testId}`, { method: 'DELETE' });
      toast('Test deleted', 'success');
      router.push('/');
    } catch { toast('Failed to delete', 'error'); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  if (!test) return <p className="text-center text-slate-500 py-20">Test not found</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/subjects/${test.subjectId}`} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{test.title}</h1>
          <p className="text-sm text-slate-500">{test.subjectName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/tests/${test._id}/edit`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </Link>
          {test.status === 'published' && (
            <Link href={`/tests/${test._id}/take`} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">
              <Play className="w-4 h-4" /> Start Test
            </Link>
          )}
          <button onClick={handleDelete} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: HelpCircle, label: 'Questions', value: questions.length },
          { icon: Clock, label: 'Duration', value: `${test.durationMinutes} min` },
          { icon: BarChart2, label: 'Attempts', value: test.attemptCount ?? 0 },
          { icon: AlertTriangle, label: 'Neg. Marks', value: test.negativeMarks },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
            <Icon className="w-5 h-5 mx-auto mb-1 text-indigo-500" />
            <p className="text-xs text-slate-500">{label}</p>
            <p className="font-bold text-slate-900 dark:text-white">{String(value)}</p>
          </div>
        ))}
      </div>

      {/* Status + details */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', getDifficultyColor(test.difficulty))}>{test.difficulty}</span>
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', test.status === 'published' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400')}>
            {test.status === 'published' ? 'Published' : 'Draft'}
          </span>
        </div>
        {test.description && <p className="text-sm text-slate-600 dark:text-slate-400">{test.description}</p>}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-slate-500">Correct Marks:</span> <span className="font-medium">{test.correctMarks}</span></div>
          <div><span className="text-slate-500">Negative Marks:</span> <span className="font-medium">{test.negativeMarks}</span></div>
          <div><span className="text-slate-500">Q. Order:</span> <span className="font-medium capitalize">{test.questionOrderMode}</span></div>
          <div><span className="text-slate-500">Opt. Order:</span> <span className="font-medium capitalize">{test.optionOrderMode}</span></div>
        </div>
        {test.instructions && (
          <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg text-sm text-amber-800 dark:text-amber-300">
            <strong>Instructions:</strong> {test.instructions}
          </div>
        )}
      </div>

      {/* Questions preview */}
      <div className="space-y-3">
        <h2 className="font-semibold text-slate-900 dark:text-white">Questions ({questions.length})</h2>
        {questions.map((q, idx) => (
          <div key={q._id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
              <div className="flex-1">
                <p className="text-sm text-slate-900 dark:text-white font-medium">{q.questionText}</p>
                {q.imageUrl && <img src={q.imageUrl} alt="" className="mt-2 max-h-32 rounded-lg object-contain" />}
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {q.options.map((opt) => (
                    <div key={opt.id} className={cn('flex items-center gap-1.5 text-xs px-2 py-1 rounded',
                      opt.id === q.correctAnswer ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-600 dark:text-slate-400')}>
                      <span className="font-bold">{opt.id}.</span> {opt.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        {questions.length === 0 && (
          <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            No questions yet. <Link href={`/tests/${test._id}/edit`} className="text-indigo-500 hover:underline">Add questions</Link>.
          </div>
        )}
      </div>
    </div>
  );
}
