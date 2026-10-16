import { z } from 'zod';

export const CreateNewsletterSubscriberSchema = z.object({
  email: z.string().email(),
  active: z.boolean().default(true)
});

export const UpdateNewsletterSubscriberSchema = CreateNewsletterSubscriberSchema.partial();

export const NewsletterFilterSchema = z.object({
  active: z.enum(['true', 'false']).optional(),
  limit: z.string().default('10').transform(Number),
  offset: z.string().default('0').transform(Number),
  sortBy: z.enum(['email', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export type CreateNewsletterInput = z.infer<typeof CreateNewsletterSubscriberSchema>;
export type UpdateNewsletterInput = z.infer<typeof UpdateNewsletterSubscriberSchema>;
export type NewsletterFilter = z.infer<typeof NewsletterFilterSchema>;
