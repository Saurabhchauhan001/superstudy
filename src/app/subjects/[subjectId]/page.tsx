'use client';
import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Search, Edit2, BookOpen, Clock, Loader2 } from 'lucide-react';
import { Subject, Test } from '@/types';
import TestCard from '@/components/tests/TestCard';
import { toast } from '@/components/ui/Toaster';

export const dynamic = 'force-dynamic';

export default function SubjectPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = use(params);
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/subjects/${subjectId}`);
      if (!res.ok) { router.push('/'); return; }
      const data = await res.json();
      setSubject(data.subject);
      setTests(data.tests || []);
    } catch {
      toast('Failed to load subject', 'error');
    } finally {
      setLoading(false);
    }
  }, [subjectId, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this test? All attempt history will be permanently deleted.')) return;
    try {
      const res = await fetch(`/api/tests/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('Test deleted', 'success');
      fetchData();
    } catch { toast('Failed to delete test', 'error'); }
  }

  async function handleDuplicate(id: string) {
    try {
      const res = await fetch(`/api/tests/${id}`);
      const data = await res.json();
      const { test, questions } = data;
      const dupRes = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...test,
          _id: undefined,
          title: `${test.title} (Copy)`,
          status: 'draft',
          questions: questions.map((q: Record<string, unknown>) => ({ ...q, _id: undefined, testId: undefined })),
        }),
      });
      if (!dupRes.ok) throw new Error();
      toast('Test duplicated as draft', 'success');
      fetchData();
    } catch { toast('Failed to duplicate test', 'error'); }
  }

  const filtered = tests.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || t.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  if (!subject) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{subject.icon ?? '📚'}</span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{subject.name}</h1>
              {subject.description && <p className="text-sm text-slate-500 dark:text-slate-400">{subject.description}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/subjects/${subjectId}/edit`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </Link>
          <Link
            href={`/tests/new?subjectId=${subjectId}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add Test
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <span className="text-slate-600 dark:text-slate-400">{tests.length} Tests</span>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2">
          <Clock className="w-4 h-4 text-emerald-500" />
          <span className="text-slate-600 dark:text-slate-400">{subject.attemptedCount ?? 0} Attempted</span>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search tests..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
          {(['all', 'published', 'draft'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Tests */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {search || filter !== 'all' ? 'No tests match your filters' : 'No tests yet'}
          </h3>
          {!search && filter === 'all' && (
            <Link href={`/tests/new?subjectId=${subjectId}`}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> Create First Test
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((test) => (
            <TestCard key={test._id} test={test} onDelete={handleDelete} onDuplicate={handleDuplicate} />
          ))}
        </div>
      )}
    </div>
  );
}
