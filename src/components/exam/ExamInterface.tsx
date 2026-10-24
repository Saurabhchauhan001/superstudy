'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Flag, RotateCcw, Send, Clock, Loader2, Maximize, Minimize, AlertTriangle, CheckCircle2, X, Eye, HelpCircle } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import { toast } from '@/components/ui/Toaster';

interface Option {
  id: string;
  text: string;
}

interface ExamQuestion {
  _id: string;
  questionText: string;
  imageUrl?: string;
  options: Option[];
  marks?: number;
  negativeMarks?: number;
}

interface AnswerState {
  selectedAnswer?: string;
  markedForReview: boolean;
}

type QuestionStatus = 'not-visited' | 'not-answered' | 'answered' | 'marked' | 'answered-marked';

export default function ExamInterface({ testId }: { testId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [attemptId, setAttemptId] = useState('');
  const [testTitle, setTestTitle] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [showConfirm, setShowConfirm] = useState(false);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const STORAGE_KEY = `exam_${testId}`;

  useEffect(() => {
    initExam();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testId]);

  // Fullscreen change listener
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Keyboard navigation for desktop: A, B, C, D to answer
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (loading || submitting || showConfirm || zoomImage) return;

      const q = questions[current];
      if (!q) return;

      const key = e.key.toUpperCase();
      const optionMap: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
      const selectedId = ['A', 'B', 'C', 'D', 'E', 'F'].includes(key)
        ? key
        : optionMap[e.key] || null;

      if (selectedId) {
        const hasOpt = q.options.some((o) => o.id === selectedId);
        if (hasOpt) {
          selectAnswer(q._id, selectedId);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [current, questions, loading, submitting, showConfirm, zoomImage]);

  async function initExam() {
    // Check for saved session in case of accidental reload
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const session = JSON.parse(saved);
        if (session.attemptId && session.questions && session.timeLeft > 0) {
          setAttemptId(session.attemptId);
          setQuestions(session.questions);
          setTestTitle(session.testTitle);
          setSubjectName(session.subjectName || '');
          setDurationSeconds(session.durationSeconds);
          setTimeLeft(session.timeLeft);
          setAnswers(session.answers ?? {});
          setVisited(new Set(session.visited || [0]));
          startTimeRef.current = Date.now() - ((session.durationSeconds - session.timeLeft) * 1000);
          setLoading(false);
          startTimer(session.timeLeft);
          return;
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // Start fresh attempt
    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const { attempt, questions: qs } = data;

      // Fetch test details
      const testRes = await fetch(`/api/tests/${testId}`);
      const testData = await testRes.json();
      const durationSec = (testData.test?.durationMinutes ?? 30) * 60;

      setAttemptId(attempt._id);
      setQuestions(qs);
      setTestTitle(testData.test?.title ?? 'Test');
      setSubjectName(testData.test?.subjectName ?? '');
      setDurationSeconds(durationSec);
      setTimeLeft(durationSec);
      startTimeRef.current = Date.now();
      setLoading(false);
      startTimer(durationSec);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to start test', 'error');
      router.back();
    }
  }

  function startTimer(initial: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    let t = initial;
    timerRef.current = setInterval(() => {
      t -= 1;
      setTimeLeft(t);
      if (t <= 0) {
        clearInterval(timerRef.current!);
        submitExam(true);
      }
    }, 1000);
  }

  // Persist session to localStorage
  useEffect(() => {
    if (!attemptId || loading) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        attemptId,
        questions,
        testTitle,
        subjectName,
        durationSeconds,
        timeLeft,
        answers,
        visited: Array.from(visited),
      })
    );
  }, [answers, timeLeft, attemptId, loading, visited, questions, testTitle, subjectName, durationSeconds]);

  function selectAnswer(questionId: string, optId: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selectedAnswer: optId,
        markedForReview: prev[questionId]?.markedForReview ?? false,
      },
    }));
  }

  function clearAnswer(questionId: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], selectedAnswer: undefined },
    }));
  }

  function toggleMarkForReview(questionId: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        markedForReview: !(prev[questionId]?.markedForReview ?? false),
      },
    }));
  }

  function navigate(idx: number) {
    if (idx < 0 || idx >= questions.length) return;
    setCurrent(idx);
    setVisited((prev) => new Set(prev).add(idx));
    setMobilePaletteOpen(false);
  }

  function handleSaveAndNext() {
    setVisited((prev) => new Set(prev).add(current));
    if (current < questions.length - 1) {
      navigate(current + 1);
    } else {
      setShowConfirm(true);
    }
  }

  function handleMarkAndNext() {
    const q = questions[current];
    if (q) {
      toggleMarkForReview(q._id);
    }
    setVisited((prev) => new Set(prev).add(current));
    if (current < questions.length - 1) {
      navigate(current + 1);
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function getQuestionStatus(q: ExamQuestion, idx: number): QuestionStatus {
    if (!visited.has(idx)) return 'not-visited';
    const ans = answers[q._id];
    const hasAnswer = Boolean(ans?.selectedAnswer);
    const marked = Boolean(ans?.markedForReview);

    if (hasAnswer && marked) return 'answered-marked';
    if (hasAnswer) return 'answered';
    if (marked) return 'marked';
    return 'not-answered';
  }

  const statusStyle: Record<QuestionStatus, string> = {
    'not-visited': 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700',
    'not-answered': 'bg-rose-500 text-white border-rose-600',
    'answered': 'bg-emerald-600 text-white border-emerald-700',
    'marked': 'bg-violet-600 text-white border-violet-700',
    'answered-marked': 'bg-violet-600 text-white border-violet-700 ring-2 ring-emerald-400 ring-offset-1',
  };

  async function submitExam(isTimedOut = false) {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);

    const answersPayload: Record<string, { selectedAnswer?: string; markedForReview?: boolean }> = {};
    for (const qItem of questions) {
      const ans = answers[qItem._id];
      answersPayload[qItem._id] = {
        selectedAnswer: ans?.selectedAnswer,
        markedForReview: ans?.markedForReview ?? false,
      };
    }

    try {
      const res = await fetch(`/api/attempts/${attemptId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersPayload, timeTakenSeconds: timeTaken, isTimedOut }),
      });
      if (!res.ok) throw new Error('Submission failed');
      localStorage.removeItem(STORAGE_KEY);
      router.push(`/attempts/${attemptId}`);
    } catch {
      toast('Submission failed. Please try again.', 'error');
      setSubmitting(false);
    }
  }

  const q = questions[current];

  // Stats calculation
  const answeredCount = questions.filter((item) => Boolean(answers[item._id]?.selectedAnswer)).length;
  const markedCount = questions.filter((item) => Boolean(answers[item._id]?.markedForReview)).length;
  const answeredAndMarkedCount = questions.filter(
    (item) => Boolean(answers[item._id]?.selectedAnswer) && Boolean(answers[item._id]?.markedForReview)
  ).length;
  const visitedCount = visited.size;
  const notAnsweredCount = questions.filter((item, idx) => visited.has(idx) && !answers[item._id]?.selectedAnswer).length;
  const notVisitedCount = questions.length - visitedCount;

  const timerDanger = timeLeft < 60;
  const timerWarning = timeLeft < 300;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <div className="text-center">
          <p className="font-bold text-slate-800 dark:text-slate-200">Setting Up Examination Environment...</p>
          <p className="text-xs text-slate-500 mt-1">Preparing your questions and starting the exam timer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto select-none pb-12">
      {/* 5-minute warning banner */}
      {timerWarning && (
        <div
          className={cn(
            'flex items-center justify-between px-4 py-2 rounded-xl text-xs font-semibold animate-pulse',
            timerDanger
              ? 'bg-rose-500 text-white'
              : 'bg-amber-500 text-white'
          )}
        >
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>
              {timerDanger
                ? 'CRITICAL: Less than 1 minute remaining! The exam will auto-submit when the timer expires.'
                : 'Attention: Less than 5 minutes remaining. Please review your answers.'}
            </span>
          </div>
          <span className="font-mono font-bold text-sm">{formatTime(timeLeft)}</span>
        </div>
      )}

      {/* Top Exam Header Bar */}
      <div
        className={cn(
          'flex flex-wrap items-center justify-between px-4 py-3 rounded-2xl border transition-all shadow-xs gap-3',
          timerDanger
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
            : timerWarning
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        )}
      >
        {/* Test Name & Counter */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {current + 1}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {testTitle}
            </h1>
            <p className="text-[11px] text-slate-500 truncate">
              {subjectName ? `${subjectName} • ` : ''}Question {current + 1} of {questions.length}
            </p>
          </div>
        </div>

        {/* Timer Display */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-base sm:text-lg font-bold border',
              timerDanger
                ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border-rose-300'
                : timerWarning
                ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
            )}
          >
            <Clock className={cn('w-4 h-4', timerDanger ? 'text-rose-600 animate-spin' : 'text-slate-500')} />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors hidden sm:block"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Exam Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Mobile Question Palette Drawer Toggle */}
          <button
            type="button"
            onClick={() => setMobilePaletteOpen(true)}
            className="lg:hidden flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Palette ({answeredCount}/{questions.length})
          </button>

          {/* Submit Button */}
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> Submit
          </button>
        </div>
      </div>

      {/* Main Examination Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Question & Options Area */}
        <div className="lg:col-span-3 space-y-4">
          {q && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 space-y-6 shadow-xs">
              {/* Question metadata bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">Question No. {current + 1}</span>
                  {answers[q._id]?.markedForReview && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-semibold text-[10px]">
                      <Flag className="w-3 h-3" /> Marked for Review
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                  <span className="text-emerald-600 font-semibold">+{q.marks ?? 1} mark</span>
                  <span>•</span>
                  <span className="text-rose-500 font-semibold">-{q.negativeMarks ?? 0} neg</span>
                </div>
              </div>

              {/* Question Statement */}
              <div>
                <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-white leading-relaxed">
                  {q.questionText}
                </p>

                {/* Optional Image with Zoom Lightbox Click */}
                {q.imageUrl && (
                  <div className="mt-4">
                    <div
                      onClick={() => setZoomImage(q.imageUrl || null)}
                      className="group relative inline-block cursor-zoom-in rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-950 p-1"
                      title="Click to enlarge image"
                    >
                      <img
                        src={q.imageUrl}
                        alt="Question Diagram"
                        className="max-h-64 sm:max-h-80 w-auto rounded-lg object-contain mx-auto"
                      />
                      <span className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Tap to zoom
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Options Section */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Select one option:
                </span>

                <div className="grid grid-cols-1 gap-2.5">
                  {q.options.map((opt) => {
                    const isSelected = answers[q._id]?.selectedAnswer === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => selectAnswer(q._id, opt.id)}
                        className={cn(
                          'w-full flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border-2 text-left transition-all cursor-pointer min-h-[52px]',
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50/60 dark:hover:bg-slate-900/40'
                        )}
                      >
                        {/* Option Identifier Badge */}
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0 transition-all',
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                              : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                          )}
                        >
                          {opt.id}
                        </div>

                        {/* Option Text */}
                        <span
                          className={cn(
                            'text-sm sm:text-base leading-snug',
                            isSelected
                              ? 'text-indigo-950 dark:text-indigo-200 font-semibold'
                              : 'text-slate-800 dark:text-slate-200'
                          )}
                        >
                          {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Action Controls (Sticky on mobile or bottom of card) */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                {/* Secondary controls: Clear, Mark */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleMarkForReview(q._id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer',
                      answers[q._id]?.markedForReview
                        ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border border-violet-300'
                        : 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    {answers[q._id]?.markedForReview ? 'Unmark Review' : 'Mark for Review'}
                  </button>

                  <button
                    type="button"
                    onClick={() => clearAnswer(q._id)}
                    disabled={!answers[q._id]?.selectedAnswer}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Clear Response
                  </button>
                </div>

                {/* Primary navigation: Previous, Save & Next */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(current - 1)}
                    disabled={current === 0}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAndNext}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {current < questions.length - 1 ? (
                      <>
                        Save & Next <ChevronRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Save & Finish <Send className="w-3.5 h-3.5 ml-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Question Palette Sidebar (Desktop) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sticky top-20 shadow-xs space-y-4">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-slate-800">
              Question Navigator
            </h2>

            {/* Questions Grid */}
            <div className="grid grid-cols-5 gap-1.5 max-h-[300px] overflow-y-auto p-0.5">
              {questions.map((item, idx) => {
                const status = getQuestionStatus(item, idx);
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => navigate(idx)}
                    className={cn(
                      'w-full aspect-square rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center',
                      statusStyle[status],
                      idx === current && 'ring-2 ring-indigo-500 ring-offset-2 scale-105'
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Status Legend */}
            <div className="space-y-1.5 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
              {[
                { status: 'answered', label: `Answered (${answeredCount})` },
                { status: 'not-answered', label: `Not Answered (${notAnsweredCount})` },
                { status: 'marked', label: `Marked for Review (${markedCount})` },
                { status: 'answered-marked', label: `Answered & Marked (${answeredAndMarkedCount})` },
                { status: 'not-visited', label: `Not Visited (${notVisitedCount})` },
              ].map(({ status, label }) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={cn('w-4 h-4 rounded border shrink-0', statusStyle[status as QuestionStatus])} />
                  <span className="text-slate-600 dark:text-slate-400">{label}</span>
                </div>
              ))}
            </div>

            {/* Fast Stats Bar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Attempted</span>
                <span className="font-bold text-emerald-600">{answeredCount}/{questions.length}</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Question Palette Drawer */}
      {mobilePaletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end lg:hidden">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm h-full p-5 space-y-4 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Question Navigator</h3>
                <button
                  type="button"
                  onClick={() => setMobilePaletteOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-5 gap-2 my-4">
                {questions.map((item, idx) => {
                  const status = getQuestionStatus(item, idx);
                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => navigate(idx)}
                      className={cn(
                        'w-full aspect-square rounded-xl text-xs font-bold border transition-all flex items-center justify-center',
                        statusStyle[status],
                        idx === current && 'ring-2 ring-indigo-500 ring-offset-2'
                      )}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="space-y-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                {[
                  { status: 'answered', label: `Answered (${answeredCount})` },
                  { status: 'not-answered', label: `Not Answered (${notAnsweredCount})` },
                  { status: 'marked', label: `Marked for Review (${markedCount})` },
                  { status: 'answered-marked', label: `Answered & Marked (${answeredAndMarkedCount})` },
                  { status: 'not-visited', label: `Not Visited (${notVisitedCount})` },
                ].map(({ status, label }) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className={cn('w-4 h-4 rounded border shrink-0', statusStyle[status as QuestionStatus])} />
                    <span className="text-slate-600 dark:text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMobilePaletteOpen(false);
                setShowConfirm(true);
              }}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm"
            >
              Finish & Submit Test
            </button>
          </div>
        </div>
      )}

      {/* Image Zoom Lightbox Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={zoomImage} alt="Diagram Zoomed" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
            <button
              type="button"
              onClick={() => setZoomImage(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-white text-slate-900 shadow-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Final Submit Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ready to Submit Exam?</h3>
              <p className="text-xs text-slate-500 mt-0.5">Please review your question attempt summary before final submission.</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{answeredCount}</p>
                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Answered</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{questions.length - answeredCount}</p>
                <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">Unanswered</p>
              </div>
              <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60">
                <p className="text-2xl font-black text-violet-600 dark:text-violet-400">{markedCount}</p>
                <p className="text-[11px] font-semibold text-violet-700 dark:text-violet-400">Marked</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Time Remaining:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{formatTime(timeLeft)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="font-bold text-slate-900 dark:text-white">{questions.length}</span>
              </div>
            </div>

            <p className="text-xs text-amber-600 dark:text-amber-400">
              ⚠️ Once submitted, you cannot modify your answers. You will immediately see your detailed score and explanation breakdown.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Resume Exam
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  submitExam(false);
                }}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
