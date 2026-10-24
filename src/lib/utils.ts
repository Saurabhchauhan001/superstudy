import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'Easy': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400';
    case 'Medium': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
    case 'Hard': return 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400';
    case 'Mixed': return 'text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400';
    default: return 'text-slate-600 bg-slate-50 dark:bg-slate-900/20 dark:text-slate-400';
  }
}

export function getScoreColor(percentage: number): string {
  if (percentage >= 80) return 'text-emerald-600';
  if (percentage >= 60) return 'text-amber-600';
  if (percentage >= 40) return 'text-orange-600';
  return 'text-rose-600';
}
