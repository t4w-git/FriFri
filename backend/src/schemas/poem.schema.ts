import { z } from 'zod';

const PoemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  text: z.string().optional(),
  author: z.string().max(255).optional(),
  audioUrl: z.string().optional().or(z.literal('')),
  thumbnailUrl: z.string().optional().or(z.literal('')),
  publishedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  excerpt: z.string().optional(),
  active: z.boolean().default(true),
  partA: z.string().optional().or(z.literal('')),
  partB: z.string().optional().or(z.literal('')),
  partC: z.string().optional().or(z.literal(''))
});

export const CreatePoemSchema = PoemSchema.refine(
  ({ text, partA, partB, partC }) =>
    Boolean(text?.trim()) || [partA, partB, partC].every(part => Boolean(part?.trim())),
  {
    path: ['text'],
    message: 'Text or all three quartine are required'
  }
);

export const UpdatePoemSchema = PoemSchema.partial();

export const PoemFilterSchema = z.object({
  active: z.enum(['true', 'false']).optional(),
  author: z.string().optional(),
  search: z.string().optional(),
  limit: z.string().default('10').transform(Number),
  offset: z.string().default('0').transform(Number),
  sortBy: z.enum(['title', 'publishedDate', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export type CreatePoemInput = z.infer<typeof CreatePoemSchema>;
export type UpdatePoemInput = z.infer<typeof UpdatePoemSchema>;
export type PoemFilter = z.infer<typeof PoemFilterSchema>;
