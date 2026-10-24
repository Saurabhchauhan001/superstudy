import { Suspense } from 'react';
import TestForm from '@/components/tests/TestForm';

export default function NewTestPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>}>
      <TestForm />
    </Suspense>
  );
}
