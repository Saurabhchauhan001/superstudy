import { z } from 'zod';

export const SubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(100),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  topics: z.array(z.string()).optional(),
  displayOrder: z.number().optional(),
});

export const OptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1, 'Option text is required'),
});

export const QuestionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required'),
  imageUrl: z.string().optional(),
  imagePublicId: z.string().optional(),
  options: z.array(OptionSchema).min(2, 'At least 2 options required').max(6),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  explanation: z.string().optional(),
  marks: z.number().optional(),
  negativeMarks: z.number().optional(),
  displayOrder: z.number().optional(),
});

export const TestSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  title: z.string().min(1, 'Test title is required').max(200),
  description: z.string().max(1000).optional(),
  subtopic: z.string().max(100).optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Mixed']).default('Medium'),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute'),
  correctMarks: z.number().min(0).default(1),
  negativeMarks: z.number().min(0).default(0),
  questionOrderMode: z.enum(['fixed', 'random']).default('fixed'),
  optionOrderMode: z.enum(['fixed', 'random']).default('fixed'),
  instructions: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  questions: z.array(QuestionSchema).optional(),
});

export type SubjectFormData = z.infer<typeof SubjectSchema>;
export type TestFormData = z.infer<typeof TestSchema>;
export type QuestionFormData = z.infer<typeof QuestionSchema>;
