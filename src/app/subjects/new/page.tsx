'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/ui/Toaster';

const ICONS = ['📚', '💻', '🖥️', '🔢', '🌐', '🧮', '⚙️', '🗄️', '🔍', '📊', '✏️', '🧠', '📐', '🔬', '💡', '🏦', '📝', '🎯', '🧪', '🧬'];

export default function NewSubjectPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', icon: '📚' });
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleAddTopic() {
    const trimmed = newTopicInput.trim();
    if (!trimmed) return;
    if (topics.includes(trimmed)) {
      toast('Topic already added', 'error');
      return;
    }
    setTopics((prev) => [...prev, trimmed]);
    setNewTopicInput('');
  }

  function handleRemoveTopic(topicToRemove: string) {
    setTopics((prev) => prev.filter((t) => t !== topicToRemove));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Subject name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, topics }),
      });
      if (!res.ok) throw new Error();
      const { subject } = await res.json();
      toast('Subject created successfully!', 'success');
      router.push(`/subjects/${subject._id}`);
    } catch {
      toast('Failed to create subject', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Subject</h1>
          <p className="text-xs text-slate-500">Organize your tests by subject and relevant topics.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xs">
        {/* Icon picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Subject Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setForm((f) => ({ ...f, icon }))}
                className={`w-10 h-10 rounded-xl border text-lg flex items-center justify-center transition-all ${
                  form.icon === icon
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 scale-110 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Subject Name *
          </label>
          <input
            type="text"
            placeholder="e.g. Computer Science, Mathematics, Biology"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description (Optional)
          </label>
          <textarea
            placeholder="Brief description or exam syllabus coverage..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Topics Management */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Topics / Chapters (Optional)
          </label>
          <p className="text-xs text-slate-400">Add topics you want to practice within this subject.</p>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Data Structures, Thermodynamics, Calculus"
              value={newTopicInput}
              onChange={(e) => setNewTopicInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTopic();
                }
              }}
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddTopic}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {topics.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(t)}
                    className="hover:text-rose-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving Subject...' : 'Create Subject'}
        </button>
      </form>
    </div>
  );
}
