'use client';
import { use, useEffect, useState } from 'react';
import TestForm from '@/components/tests/TestForm';

export const dynamic = 'force-dynamic';

export default function EditTestPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = use(params);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tests/${testId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [testId]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
  if (!data) return <p className="text-center text-slate-500 py-20">Test not found</p>;

  return <TestForm testId={testId} initialData={data} />;
}
