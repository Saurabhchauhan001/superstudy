'use client';
import Link from 'next/link';
import { Clock, HelpCircle, Play, Edit2, Trash2, Copy, BarChart2, CheckCircle, FileText } from 'lucide-react';
import { Test } from '@/types';
import { cn, getDifficultyColor, getScoreColor, formatDateTime } from '@/lib/utils';

interface TestCardProps {
  test: Test;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

const statusConfig = {
  'Not Attempted': { label: 'Not Attempted', color: 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400' },
  'Attempted': { label: 'Attempted', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400' },
};

export default function TestCard({ test, onDelete, onDuplicate }: TestCardProps) {
  const hasAttempt = (test.attemptCount ?? 0) > 0;
  const status = hasAttempt ? 'Attempted' : 'Not Attempted';
  const sc = statusConfig[status];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title + badges */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 dark:text-white truncate">{test.title}</h3>
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getDifficultyColor(test.difficulty))}>
              {test.difficulty}
            </span>
            {test.status === 'draft' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                Draft
              </span>
            )}
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', sc.color)}>
              {sc.label}
            </span>
          </div>

          {test.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{test.description}</p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              {test.questionCount ?? 0} Questions
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {test.durationMinutes} min
            </span>
            {hasAttempt && test.lastAttempt && (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
                <span className={getScoreColor(test.lastAttempt.percentage)}>
                  {test.lastAttempt.percentage}%
                </span>
                {' '}last attempt
              </span>
            )}
            {test.lastAttempt?.startedAt && (
              <span className="text-slate-400">{formatDateTime(test.lastAttempt.startedAt)}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {test.status === 'published' && (
            <Link
              href={`/tests/${test._id}/take`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Start
            </Link>
          )}
          <Link
            href={`/tests/${test._id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            title="View details"
          >
            <FileText className="w-4 h-4" />
          </Link>
          <Link
            href={`/tests/${test._id}/edit`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </Link>
          {onDuplicate && (
            <button
              onClick={() => onDuplicate(test._id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(test._id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
