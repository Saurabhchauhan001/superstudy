import ExamInterface from '@/components/exam/ExamInterface';

export const dynamic = 'force-dynamic';

export default async function TakeTestPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  return <ExamInterface testId={testId} />;
}
