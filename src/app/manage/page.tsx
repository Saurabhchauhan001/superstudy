'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, BookOpen, Clock, Edit2, Trash2, Copy, Play, CheckCircle2, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { Test, Subject } from '@/types';
import { toast } from '@/components/ui/Toaster';
import { cn, getDifficultyColor, formatDateTime } from '@/lib/utils';

export default function ManagePage() {
  const [tab, setTab] = useState<'tests' | 'subjects'>('tests');
  const [tests, setTests] = useState<Test[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [testsRes, subsRes] = await Promise.all([
        fetch('/api/tests'),
        fetch('/api/subjects'),
      ]);
      const testsData = await testsRes.json();
      const subsData = await subsRes.json();
      setTests(testsData.tests || []);
      setSubjects(subsData.subjects || []);
    } catch {
      toast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTest(id: string) {
    if (!confirm('Are you sure you want to delete this test? All questions and attempts will be deleted.')) return;
    try {
      const res = await fetch(`/api/tests/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('Test deleted', 'success');
      setTests((prev) => prev.filter((t) => t._id !== id));
    } catch {
      toast('Failed to delete test', 'error');
    }
  }

  async function handleDuplicateTest(id: string) {
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
      loadData();
    } catch {
      toast('Failed to duplicate test', 'error');
    }
  }

  async function handleDeleteSubject(id: string) {
    if (!confirm('Delete this subject? All tests and attempts inside will be permanently deleted.')) return;
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('Subject deleted', 'success');
      setSubjects((prev) => prev.filter((s) => s._id !== id));
      loadData();
    } catch {
      toast('Failed to delete subject', 'error');
    }
  }

  const filteredTests = tests.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.subtopic && t.subtopic.toLowerCase().includes(search.toLowerCase())) ||
      (t.subjectName && t.subjectName.toLowerCase().includes(search.toLowerCase()));
    const matchDiff = filterDifficulty === 'all' || t.difficulty === filterDifficulty;
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchDiff && matchStatus;
  });

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Management Center</h1>
          <p className="text-sm text-slate-500">Manage all your MCQ tests, subjects, topics, and questions.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/subjects/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Subject
          </Link>
          <Link
            href="/tests/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Test
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setTab('tests')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all',
            tab === 'tests'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          )}
        >
          <FileText className="w-4 h-4" />
          Tests ({tests.length})
        </button>
        <button
          onClick={() => setTab('subjects')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all',
            tab === 'subjects'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          )}
        >
          <BookOpen className="w-4 h-4" />
          Subjects & Topics ({subjects.length})
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={tab === 'tests' ? 'Search tests by title, topic, subject...' : 'Search subjects...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {tab === 'tests' && (
          <div className="flex gap-2">
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Mixed">Mixed</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : tab === 'tests' ? (
        filteredTests.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">No Tests Found</h3>
            <p className="text-xs text-slate-500 mb-4">
              {search || filterDifficulty !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first MCQ test.'}
            </p>
            <Link
              href="/tests/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" /> Create Test
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Test Title</th>
                    <th className="p-4">Subject & Topic</th>
                    <th className="p-4 text-center">Duration</th>
                    <th className="p-4 text-center">Questions</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTests.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <Link href={`/tests/${t._id}`} className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                          {t.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold', getDifficultyColor(t.difficulty))}>
                            {t.difficulty}
                          </span>
                          <span className="text-xs text-slate-400">+{t.correctMarks} / -{t.negativeMarks} marks</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block">{t.subjectName || 'Unassigned'}</span>
                        {t.subtopic && <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">Topic: {t.subtopic}</span>}
                      </td>
                      <td className="p-4 text-center text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-mono font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {t.durationMinutes} min
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-xs text-slate-700 dark:text-slate-300">
                        {t.questionCount ?? 0}
                      </td>
                      <td className="p-4 text-center">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                          t.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        )}>
                          {t.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status === 'published' && (
                            <Link
                              href={`/tests/${t._id}/take`}
                              className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1"
                              title="Start Practice Exam"
                            >
                              <Play className="w-3.5 h-3.5" /> Start
                            </Link>
                          )}
                          <Link
                            href={`/tests/${t._id}/edit`}
                            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit Test"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDuplicateTest(t._id)}
                            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Duplicate Test"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTest(t._id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete Test"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Subjects Tab */
        filteredSubjects.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">No Subjects Found</h3>
            <p className="text-xs text-slate-500 mb-4">Add your subjects to organize tests and topics.</p>
            <Link
              href="/subjects/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubjects.map((sub) => (
              <div
                key={sub._id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">{sub.icon ?? '📚'}</span>
                      <div>
                        <Link href={`/subjects/${sub._id}`} className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                          {sub.name}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5">{sub.testCount ?? 0} tests • {sub.attemptedCount ?? 0} attempts</p>
                      </div>
                    </div>
                  </div>

                  {sub.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 line-clamp-2">{sub.description}</p>
                  )}

                  {/* Topics Pills */}
                  {sub.topics && sub.topics.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {sub.topics.map((tp, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                          {tp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <Link
                    href={`/tests/new?subjectId=${sub._id}`}
                    className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Test
                  </Link>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/subjects/${sub._id}/edit`}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit Subject"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleDeleteSubject(sub._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
