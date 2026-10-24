'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, BookOpen, BarChart2, Target, TrendingUp, Pencil, Trash2, Loader2, Database, Play, Clock, Sparkles } from 'lucide-react';
import { Subject, Test } from '@/types';
import SubjectCard from '@/components/dashboard/SubjectCard';
import StatsCard from '@/components/dashboard/StatsCard';
import { toast } from '@/components/ui/Toaster';
import DbConnectionModal from '@/components/database/DbConnectionModal';
import { getDifficultyColor } from '@/lib/utils';

export default function DashboardPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentTests, setRecentTests] = useState<Test[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalTests, setTotalTests] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(true);
  const [dbModalOpen, setDbModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const [subsRes, testsRes, dbRes] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/tests?status=published'),
        fetch('/api/settings/db'),
      ]);

      const subsData = await subsRes.json();
      const testsData = await testsRes.json();
      const dbData = await dbRes.json();

      setIsDbConnected(Boolean(dbData.isConnected));

      const s: Subject[] = subsData.subjects || [];
      setSubjects(s);
      setRecentTests(testsData.tests?.slice(0, 4) || []);

      setTotalTests(s.reduce((acc, sub) => acc + (sub.testCount ?? 0), 0));
      setTotalAttempted(s.reduce((acc, sub) => acc + (sub.attemptedCount ?? 0), 0));

      const withScores = s.filter((sub) => (sub.averageScore ?? 0) > 0);
      setAvgScore(
        withScores.length > 0
          ? Math.round((withScores.reduce((a, b) => a + (b.averageScore ?? 0), 0) / withScores.length) * 10) / 10
          : 0
      );
    } catch {
      toast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this subject? All tests and attempts inside will be permanently deleted.')) return;
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('Subject deleted', 'success');
      fetchDashboardData();
    } catch {
      toast('Failed to delete subject', 'error');
    }
  }

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.topics && s.topics.some((tp) => tp.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="space-y-8">
      {/* Database Connection Warning Banner if not connected */}
      {!loading && !isDbConnected && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-300 text-sm sm:text-base">
                Connect your MongoDB Database
              </h3>
              <p className="text-xs sm:text-sm text-amber-800/90 dark:text-amber-400/90 mt-0.5">
                All tests, MCQ question sets, topics, and exam results are safely stored in your MongoDB database. Paste your connection string to get started.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDbModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-xs"
          >
            Connect Database
          </button>
        </div>
      )}

      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Exam Practice Center
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Sparkles className="w-3 h-3" /> Real Exam Mode
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Practice timed MCQs with negative marking, review explanations, and track your performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/subjects/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </Link>
          <Link
            href="/tests/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Create MCQ Test
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard title="Total Subjects" value={subjects.length} icon={BookOpen} color="indigo" />
        <StatsCard title="Total Tests" value={totalTests} icon={BarChart2} color="violet" />
        <StatsCard title="Tests Attempted" value={totalAttempted} icon={Target} color="emerald" />
        <StatsCard
          title="Average Score"
          value={avgScore > 0 ? `${avgScore}%` : '—'}
          subtitle={avgScore > 0 ? 'across all tests' : 'No attempts yet'}
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Featured / Ready to Take Tests */}
      {recentTests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-500" />
              Ready to Practice (Simulated Exam)
            </h2>
            <Link href="/manage" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              View all &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {recentTests.map((t) => (
              <div
                key={t._id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                      {t.subjectName || 'Practice'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getDifficultyColor(t.difficulty)}`}>
                      {t.difficulty}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                    {t.title}
                  </h3>

                  {t.subtopic && (
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1 truncate">
                      Topic: {t.subtopic}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {t.durationMinutes}m
                    </span>
                    <span>•</span>
                    <span>{t.questionCount ?? 0} MCQs</span>
                  </div>
                </div>

                <Link
                  href={`/tests/${t._id}/take`}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  Start Exam
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Subject Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            Subjects & Topics
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search subject or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              {search ? 'No subjects match your search' : 'No subjects added yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm">
              {search
                ? 'Try a different search keyword.'
                : 'Create subjects like "Computer Science", "Mathematics", or "General Studies" to begin adding tests and topics.'}
            </p>
            {!search && (
              <Link
                href="/subjects/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Your First Subject
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((subject) => (
              <div key={subject._id} className="relative group/wrapper">
                <SubjectCard subject={subject} />
                <div className="absolute top-3 right-8 flex gap-1 opacity-0 group-hover/wrapper:opacity-100 transition-opacity">
                  <Link
                    href={`/subjects/${subject._id}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-amber-600 shadow-sm"
                    title="Edit subject"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={(e) => { e.preventDefault(); handleDelete(subject._id); }}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 shadow-sm"
                    title="Delete subject"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Database Connection Modal */}
      <DbConnectionModal
        isOpen={dbModalOpen}
        onClose={() => setDbModalOpen(false)}
        onConnected={() => {
          fetchDashboardData();
        }}
      />
    </div>
  );
}
