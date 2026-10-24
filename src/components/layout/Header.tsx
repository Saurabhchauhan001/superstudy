'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, BarChart2, FolderCheck, Plus, Moon, Sun, Menu, X, Database } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import DbConnectionModal from '@/components/database/DbConnectionModal';

const navItems = [
  { label: 'Dashboard', href: '/', icon: BookOpen },
  { label: 'Analytics', href: '/analytics', icon: BarChart2 },
  { label: 'Manage All', href: '/manage', icon: FolderCheck },
];

export default function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dbModalOpen, setDbModalOpen] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
    checkDb();
  }, []);

  async function checkDb() {
    try {
      const res = await fetch('/api/settings/db');
      const data = await res.json();
      setIsDbConnected(Boolean(data.isConnected));
    } catch {
      setIsDbConnected(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900 dark:text-white">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="leading-tight">PrepTrack</span>
                <span className="text-[10px] font-normal text-slate-400 -mt-0.5 hidden sm:block">Exam MCQ Simulator</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === href
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>

            {/* Right side controls */}
            <div className="flex items-center gap-2">
              {/* MongoDB Status Pill Button */}
              <button
                type="button"
                onClick={() => setDbModalOpen(true)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer',
                  isDbConnected
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                    : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 animate-pulse'
                )}
                title="MongoDB Database Status — Click to configure"
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isDbConnected === null ? 'MongoDB...' : isDbConnected ? 'MongoDB Connected' : 'Connect MongoDB'}
                </span>
                <span className={cn('w-2 h-2 rounded-full', isDbConnected ? 'bg-emerald-500' : 'bg-amber-500')} />
              </button>

              {/* Theme toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}

              {/* Add Test button */}
              <Link
                href="/tests/new"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Add Test
              </Link>

              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Open mobile menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile nav dropdown */}
          {menuOpen && (
            <div className="md:hidden border-t border-slate-200 dark:border-slate-800 py-3 flex flex-col gap-1">
              {navItems.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium',
                    pathname === href
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                <Link
                  href="/tests/new"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Add New Test
                </Link>
                <Link
                  href="/subjects/new"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add New Subject
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Database Connection Modal */}
      <DbConnectionModal
        isOpen={dbModalOpen}
        onClose={() => setDbModalOpen(false)}
        onConnected={() => {
          checkDb();
        }}
      />
    </>
  );
}
