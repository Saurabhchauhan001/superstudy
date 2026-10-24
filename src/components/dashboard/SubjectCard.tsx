'use client';
import Link from 'next/link';
import { BookOpen, ChevronRight, BarChart2 } from 'lucide-react';
import { Subject } from '@/types';
import { cn, getScoreColor } from '@/lib/utils';

interface SubjectCardProps {
  subject: Subject;
}

export default function SubjectCard({ subject }: SubjectCardProps) {
  const progress = subject.averageScore ?? 0;

  return (
    <Link href={`/subjects/${subject._id}`}>
      <div className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-200 cursor-pointer h-full flex flex-col gap-4">
        {/* Icon + Name */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-2xl">
              {subject.icon ?? '📚'}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {subject.name}
              </h3>
              {subject.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {subject.description}
                </p>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0 mt-1" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Tests</span>
            </div>
            <p className="font-bold text-slate-900 dark:text-white">
              {subject.testCount ?? 0}
              {subject.attemptedCount != null && subject.attemptedCount > 0 && (
                <span className="font-normal text-xs text-slate-400 ml-1">
                  ({subject.attemptedCount} done)
                </span>
              )}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Avg Score</span>
            </div>
            <p className={cn('font-bold', getScoreColor(progress))}>
              {subject.averageScore != null && subject.averageScore > 0
                ? `${subject.averageScore}%`
                : '—'}
            </p>
          </div>
        </div>

        {/* Topics Pills */}
        {subject.topics && subject.topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {subject.topics.slice(0, 3).map((topic, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400"
              >
                {topic}
              </span>
            ))}
            {subject.topics.length > 3 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] text-slate-400">
                +{subject.topics.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
