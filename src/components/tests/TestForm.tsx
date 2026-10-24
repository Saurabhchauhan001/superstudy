'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Copy, Image as ImageIcon, X, Save, Eye, Loader2, FileText, Link as LinkIcon, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/ui/Toaster';
import { Subject } from '@/types';
import { cn } from '@/lib/utils';

export interface QuestionForm {
  id: string;
  questionText: string;
  imageUrl: string;
  imagePublicId: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  marks: string;
  negativeMarks: string;
}

function createQuestion(): QuestionForm {
  const optIds = ['A', 'B', 'C', 'D'];
  return {
    id: Math.random().toString(36).slice(2),
    questionText: '',
    imageUrl: '',
    imagePublicId: '',
    options: optIds.map((id) => ({ id, text: '' })),
    correctAnswer: '',
    explanation: '',
    marks: '',
    negativeMarks: '',
  };
}

// Smart bulk MCQ parser
function parseBulkQuestionsText(text: string): QuestionForm[] {
  const rawBlocks = text.split(/\n\s*\n|\n(?=(?:Q(?:uestion)?\s*\d+[\.\:\)]|\d+[\.\)]))/i);
  const parsed: QuestionForm[] = [];

  for (const block of rawBlocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 3) continue;

    let questionText = '';
    const options: { id: string; text: string }[] = [];
    let correctAnswer = '';
    let explanation = '';

    for (const line of lines) {
      // Question line
      const qMatch = line.match(/^(?:Q(?:uestion)?\s*\d*[\.\:\)]|\d+[\.\)])\s*(.+)/i);
      // Option lines: A) text, A. text, (A) text, etc.
      const optMatch = line.match(/^(?:\(?([A-Fa-f])[\)\.]|\b([A-Fa-f])\))\s*(.+)/);
      // Answer lines: Ans: B, Answer: B, Correct: B
      const ansMatch = line.match(/^(?:Ans(?:wer)?|Correct)\s*[:\-]?\s*([A-Fa-f])/i);
      // Explanation lines: Exp: ..., Explanation: ...
      const expMatch = line.match(/^(?:Exp(?:lanation)?|Solution)\s*[:\-]?\s*(.+)/i);

      if (ansMatch) {
        correctAnswer = ansMatch[1].toUpperCase();
      } else if (expMatch) {
        explanation = expMatch[1];
      } else if (optMatch) {
        const id = (optMatch[1] || optMatch[2]).toUpperCase();
        options.push({ id, text: optMatch[3].trim() });
      } else if (qMatch) {
        questionText = qMatch[1].trim();
      } else if (!questionText && !options.length) {
        questionText = line;
      } else if (questionText && !options.length) {
        questionText += ' ' + line;
      }
    }

    if (questionText && options.length >= 2) {
      // Standardize options order if needed
      parsed.push({
        id: Math.random().toString(36).slice(2),
        questionText,
        imageUrl: '',
        imagePublicId: '',
        options: options.slice(0, 6),
        correctAnswer: correctAnswer || (options[0]?.id ?? 'A'),
        explanation,
        marks: '',
        negativeMarks: '',
      });
    }
  }

  return parsed;
}

export default function TestFormPage({
  testId,
  initialData,
}: {
  testId?: string;
  initialData?: Record<string, unknown>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedSubject = searchParams.get('subjectId') ?? '';

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [activeQ, setActiveQ] = useState(0);
  const [questions, setQuestions] = useState<QuestionForm[]>([createQuestion()]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showImageUrlBox, setShowImageUrlBox] = useState(false);

  const [testForm, setTestForm] = useState({
    subjectId: preselectedSubject,
    title: '',
    description: '',
    subtopic: '',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard' | 'Mixed',
    durationMinutes: '30',
    correctMarks: '1',
    negativeMarks: '0',
    questionOrderMode: 'fixed' as 'fixed' | 'random',
    optionOrderMode: 'fixed' as 'fixed' | 'random',
    instructions: '',
    status: 'draft' as 'draft' | 'published',
  });

  useEffect(() => {
    fetch('/api/subjects').then((r) => r.json()).then((d) => setSubjects(d.subjects || []));
  }, []);

  // Populate if editing
  useEffect(() => {
    if (initialData) {
      const { test, questions: qs } = initialData as { test: Record<string, unknown>; questions: Record<string, unknown>[] };
      if (test) {
        setTestForm({
          subjectId: String(test.subjectId ?? ''),
          title: String(test.title ?? ''),
          description: String(test.description ?? ''),
          subtopic: String(test.subtopic ?? ''),
          difficulty: (test.difficulty as 'Easy' | 'Medium' | 'Hard' | 'Mixed') ?? 'Medium',
          durationMinutes: String(test.durationMinutes ?? '30'),
          correctMarks: String(test.correctMarks ?? '1'),
          negativeMarks: String(test.negativeMarks ?? '0'),
          questionOrderMode: (test.questionOrderMode as 'fixed' | 'random') ?? 'fixed',
          optionOrderMode: (test.optionOrderMode as 'fixed' | 'random') ?? 'fixed',
          instructions: String(test.instructions ?? ''),
          status: (test.status as 'draft' | 'published') ?? 'draft',
        });
      }
      if (qs && qs.length > 0) {
        setQuestions(
          qs.map((q) => ({
            id: Math.random().toString(36).slice(2),
            questionText: String(q.questionText ?? ''),
            imageUrl: String(q.imageUrl ?? ''),
            imagePublicId: String(q.imagePublicId ?? ''),
            options: (q.options as { id: string; text: string }[]) ?? [
              { id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' },
            ],
            correctAnswer: String(q.correctAnswer ?? ''),
            explanation: String(q.explanation ?? ''),
            marks: String(q.marks ?? ''),
            negativeMarks: String(q.negativeMarks ?? ''),
          }))
        );
      }
    }
  }, [initialData]);

  const selectedSubject = subjects.find((s) => s._id === testForm.subjectId);

  function updateQ(idx: number, field: Partial<QuestionForm>) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...field } : q)));
  }

  function updateOption(qIdx: number, optId: string, text: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.map((o) => (o.id === optId ? { ...o, text } : o)) }
          : q
      )
    );
  }

  function addOption(qIdx: number) {
    const q = questions[qIdx];
    const usedIds = q.options.map((o) => o.id);
    const pool = ['A', 'B', 'C', 'D', 'E', 'F'];
    const nextId = pool.find((id) => !usedIds.includes(id)) ?? `OPT${Date.now()}`;
    updateQ(qIdx, { options: [...q.options, { id: nextId, text: '' }] });
  }

  function removeOption(qIdx: number, optId: string) {
    const q = questions[qIdx];
    if (q.options.length <= 2) { toast('Minimum 2 options required', 'error'); return; }
    updateQ(qIdx, {
      options: q.options.filter((o) => o.id !== optId),
      correctAnswer: q.correctAnswer === optId ? '' : q.correctAnswer,
    });
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, createQuestion()]);
    setActiveQ(questions.length);
  }

  function duplicateQuestion(idx: number) {
    const q = questions[idx];
    const dup: QuestionForm = { ...q, id: Math.random().toString(36).slice(2) };
    setQuestions((prev) => [...prev.slice(0, idx + 1), dup, ...prev.slice(idx + 1)]);
    setActiveQ(idx + 1);
  }

  function removeQuestion(idx: number) {
    if (questions.length === 1) { toast('A test must have at least one question', 'error'); return; }
    if (!confirm('Remove this question?')) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    setActiveQ(Math.min(activeQ, questions.length - 2));
  }

  function moveQuestion(idx: number, dir: -1 | 1) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= questions.length) return;
    setQuestions((prev) => {
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
    setActiveQ(newIdx);
  }

  async function handleImageUpload(qIdx: number, file: File) {
    setUploadingIdx(qIdx);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateQ(qIdx, { imageUrl: data.url, imagePublicId: data.publicId });
      toast('Image attached successfully', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploadingIdx(null);
    }
  }

  function handleAddImageUrl(qIdx: number) {
    if (!imageUrlInput.trim()) return;
    updateQ(qIdx, { imageUrl: imageUrlInput.trim(), imagePublicId: '' });
    setImageUrlInput('');
    setShowImageUrlBox(false);
    toast('Image URL linked', 'success');
  }

  async function removeImage(qIdx: number) {
    const q = questions[qIdx];
    if (q.imagePublicId && !q.imagePublicId.startsWith('data_')) {
      await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: q.imagePublicId }),
      });
    }
    updateQ(qIdx, { imageUrl: '', imagePublicId: '' });
  }

  function handleApplyBulkImport() {
    const parsed = parseBulkQuestionsText(bulkText);
    if (parsed.length === 0) {
      toast('Could not find valid questions. Please check the sample format.', 'error');
      return;
    }

    // If first question in current state is completely blank, replace it
    const firstIsBlank =
      questions.length === 1 &&
      !questions[0].questionText &&
      questions[0].options.every((o) => !o.text);

    if (firstIsBlank) {
      setQuestions(parsed);
      setActiveQ(0);
    } else {
      setQuestions((prev) => [...prev, ...parsed]);
      setActiveQ(questions.length);
    }

    setBulkModalOpen(false);
    setBulkText('');
    toast(`Successfully imported ${parsed.length} MCQs!`, 'success');
  }

  function validate(publish: boolean): string | null {
    if (!testForm.subjectId) return 'Please select a subject';
    if (!testForm.title.trim()) return 'Test title is required';
    if (!testForm.durationMinutes || Number(testForm.durationMinutes) < 1) return 'Duration must be at least 1 minute';
    if (publish) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText.trim()) return `Question ${i + 1}: text is required`;
        for (const opt of q.options) {
          if (!opt.text.trim()) return `Question ${i + 1}: all option texts must be filled`;
        }
        if (!q.correctAnswer) return `Question ${i + 1}: please select the correct answer`;
      }
    }
    return null;
  }

  async function handleSave(status: 'draft' | 'published') {
    const err = validate(status === 'published');
    if (err) { toast(err, 'error'); return; }

    setSaving(true);
    try {
      const payload = {
        ...testForm,
        durationMinutes: Number(testForm.durationMinutes),
        correctMarks: Number(testForm.correctMarks),
        negativeMarks: Number(testForm.negativeMarks),
        status,
        questions: questions.map((q, idx) => ({
          questionText: q.questionText,
          imageUrl: q.imageUrl || undefined,
          imagePublicId: q.imagePublicId || undefined,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || undefined,
          marks: q.marks ? Number(q.marks) : undefined,
          negativeMarks: q.negativeMarks ? Number(q.negativeMarks) : undefined,
          displayOrder: idx,
        })),
      };

      const url = testId ? `/api/tests/${testId}` : '/api/tests';
      const method = testId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast(status === 'published' ? 'Test published and ready!' : 'Draft saved!', 'success');
      router.push(`/tests/${data.test._id}`);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  const q = questions[activeQ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {testId ? 'Edit MCQ Test' : 'Create MCQ Test'}
            </h1>
            <p className="text-xs text-slate-500">Configure timer, negative marking, topics, and question set.</p>
          </div>
        </div>

        {/* Quick Bulk Import Button */}
        <button
          type="button"
          onClick={() => setBulkModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors w-fit shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Bulk Import Questions
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Test details */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
            <h2 className="font-bold text-slate-900 dark:text-white text-base">Test Configuration</h2>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject *</label>
              <select
                value={testForm.subjectId}
                onChange={(e) => setTestForm((f) => ({ ...f, subjectId: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.icon} {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Test Title *</label>
              <input
                type="text"
                value={testForm.title}
                onChange={(e) => setTestForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Operating Systems: Process Scheduling"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Subtopic / Topic */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Topic / Subtopic</label>
              <input
                type="text"
                value={testForm.subtopic}
                onChange={(e) => setTestForm((f) => ({ ...f, subtopic: e.target.value }))}
                placeholder="e.g. CPU Scheduling, CPU Bursts"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {/* Topic chips from subject */}
              {selectedSubject?.topics && selectedSubject.topics.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="text-[10px] text-slate-400 block w-full">Subject topics (click to select):</span>
                  {selectedSubject.topics.map((tp) => (
                    <button
                      key={tp}
                      type="button"
                      onClick={() => setTestForm((f) => ({ ...f, subtopic: tp }))}
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] transition-colors',
                        testForm.subtopic === tp
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      )}
                    >
                      {tp}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Timer & Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Exam Duration (Minutes) *
              </label>
              <input
                type="number"
                min={1}
                value={testForm.durationMinutes}
                onChange={(e) => setTestForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {[15, 30, 45, 60, 90, 180].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setTestForm((f) => ({ ...f, durationMinutes: String(mins) }))}
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-mono transition-colors',
                      testForm.durationMinutes === String(mins)
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    )}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Marking Scheme */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Correct Marks</label>
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  value={testForm.correctMarks}
                  onChange={(e) => setTestForm((f) => ({ ...f, correctMarks: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Negative Marks</label>
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  value={testForm.negativeMarks}
                  onChange={(e) => setTestForm((f) => ({ ...f, negativeMarks: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Order Modes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Question Order</label>
                <select
                  value={testForm.questionOrderMode}
                  onChange={(e) => setTestForm((f) => ({ ...f, questionOrderMode: e.target.value as 'fixed' | 'random' }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="fixed">Fixed</option>
                  <option value="random">Shuffle / Random</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Option Order</label>
                <select
                  value={testForm.optionOrderMode}
                  onChange={(e) => setTestForm((f) => ({ ...f, optionOrderMode: e.target.value as 'fixed' | 'random' }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="fixed">Fixed</option>
                  <option value="random">Shuffle / Random</option>
                </select>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Difficulty Level</label>
              <select
                value={testForm.difficulty}
                onChange={(e) => setTestForm((f) => ({ ...f, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' | 'Mixed' }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {['Easy', 'Medium', 'Hard', 'Mixed'].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Exam Instructions</label>
              <textarea
                value={testForm.instructions}
                onChange={(e) => setTestForm((f) => ({ ...f, instructions: e.target.value }))}
                placeholder="e.g. Total 30 questions. Each wrong answer deducts 0.25 marks. No calculator allowed."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleSave('published')}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold transition-colors shadow-xs cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Publish & Ready for Practice
            </button>
            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save as Draft
            </button>
          </div>
        </div>

        {/* Right: Question editor */}
        <div className="xl:col-span-2 space-y-4">
          {/* Question Nav Palette */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                Question Set ({questions.length} total)
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-500" /> Bulk Import
                </button>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Question
                </button>
              </div>
            </div>

            {/* Grid / List of Question Numbers */}
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
              {questions.map((qItem, idx) => {
                const isComplete = Boolean(qItem.questionText && qItem.correctAnswer);
                return (
                  <button
                    key={qItem.id}
                    type="button"
                    onClick={() => setActiveQ(idx)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-xs font-bold border transition-all cursor-pointer',
                      idx === activeQ
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                        : isComplete
                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Question Form */}
          {q && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center justify-center">
                    Q{activeQ + 1}
                  </span>
                  <span className="text-xs text-slate-400">Editing question {activeQ + 1} of {questions.length}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveQuestion(activeQ, -1)}
                    disabled={activeQ === 0}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                    title="Move Up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(activeQ, 1)}
                    disabled={activeQ === questions.length - 1}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                    title="Move Down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateQuestion(activeQ)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600"
                    title="Duplicate Question"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(activeQ)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Question Text *
                </label>
                <textarea
                  value={q.questionText}
                  onChange={(e) => updateQ(activeQ, { questionText: e.target.value })}
                  placeholder="Enter MCQ statement or question..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Optional Question Image */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                    Question Image / Diagram (Optional)
                  </label>
                  {!q.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setShowImageUrlBox(!showImageUrlBox)}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <LinkIcon className="w-3 h-3" />
                      {showImageUrlBox ? 'Cancel URL' : 'Or paste Image URL'}
                    </button>
                  )}
                </div>

                {q.imageUrl ? (
                  <div className="relative inline-block mt-1">
                    <img
                      src={q.imageUrl}
                      alt="Question Diagram"
                      className="max-h-48 rounded-xl border border-slate-200 dark:border-slate-700 object-contain p-1 bg-slate-50 dark:bg-slate-950"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(activeQ)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-500 text-white hover:bg-rose-600 shadow-md cursor-pointer"
                      title="Remove Image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {showImageUrlBox ? (
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://example.com/diagram.png"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddImageUrl(activeQ)}
                          className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                        >
                          Attach
                        </button>
                      </div>
                    ) : (
                      <label
                        className={cn(
                          'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:border-indigo-500 hover:text-indigo-600 cursor-pointer transition-colors w-fit text-xs font-medium',
                          uploadingIdx === activeQ && 'opacity-60 pointer-events-none'
                        )}
                      >
                        {uploadingIdx === activeQ ? (
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                        ) : (
                          <ImageIcon className="w-4 h-4" />
                        )}
                        {uploadingIdx === activeQ ? 'Attaching Image...' : 'Upload Image (PNG, JPG, WebP)'}
                        <input
                          type="file"
                          accept="image/png,image/jpg,image/jpeg,image/webp,image/gif,image/svg+xml"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleImageUpload(activeQ, f);
                          }}
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* Options */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Options * (Select radio button for the correct answer)
                  </label>
                  <span className="text-[11px] text-slate-400">Marked: <strong>{q.correctAnswer || 'None'}</strong></span>
                </div>

                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const isCorrect = q.correctAnswer === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className={cn(
                          'flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all',
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950'
                        )}
                      >
                        {/* Radio selector for correct answer */}
                        <button
                          type="button"
                          onClick={() => updateQ(activeQ, { correctAnswer: opt.id })}
                          className={cn(
                            'w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 font-bold text-xs transition-all cursor-pointer',
                            isCorrect
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 text-slate-500 hover:border-emerald-400'
                          )}
                          title={`Mark ${opt.id} as correct`}
                        >
                          {opt.id}
                        </button>

                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => updateOption(activeQ, opt.id, e.target.value)}
                          placeholder={`Option ${opt.id} text...`}
                          className="flex-1 bg-transparent text-sm focus:outline-none text-slate-900 dark:text-white"
                        />

                        {isCorrect && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full shrink-0">
                            Correct
                          </span>
                        )}

                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(activeQ, opt.id)}
                            className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                            title="Remove option"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {q.options.length < 6 && (
                  <button
                    type="button"
                    onClick={() => addOption(activeQ)}
                    className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </button>
                )}
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Explanation & Solution (Shown after test submission)
                </label>
                <textarea
                  value={q.explanation}
                  onChange={(e) => updateQ(activeQ, { explanation: e.target.value })}
                  placeholder="Explain why this answer is correct so you can learn from mistakes during review..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Navigation between questions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveQ(Math.max(0, activeQ - 1))}
                  disabled={activeQ === 0}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
                >
                  &larr; Previous Question
                </button>
                {activeQ < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveQ(activeQ + 1)}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                  >
                    Next Question &rarr;
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Question
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Import Questions Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-2xl w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setBulkModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Bulk Import MCQs</h3>
                <p className="text-xs text-slate-500">Paste multiple questions at once to save hours of manual typing.</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Paste Questions Text
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setBulkText(
`Q1: What is the time complexity of searching in a balanced Binary Search Tree (BST)?
A) O(1)
B) O(log n)
C) O(n)
D) O(n log n)
Answer: B
Explanation: In a balanced BST like AVL or Red-Black tree, the height is O(log n), so search takes O(log n).

Q2: Which HTTP method is typically used to update an existing resource?
A) GET
B) POST
C) PUT
D) DELETE
Ans: C
Explanation: PUT or PATCH is standard for modifying existing resources.

Q3: Which layer of the OSI model handles end-to-end communication and port addressing?
A) Network Layer
B) Transport Layer
C) Data Link Layer
D) Application Layer
Answer: B
Explanation: The Transport Layer (TCP/UDP) manages end-to-end communication and port numbers.`
                    )
                  }
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Insert Sample Template
                </button>
              </div>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Paste questions here with options A, B, C, D and Answer: X..."
                rows={12}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulkImport}
                disabled={!bulkText.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                Parse & Add to Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
