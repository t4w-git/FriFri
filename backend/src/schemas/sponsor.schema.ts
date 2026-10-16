import { z } from 'zod';

export const CreateSponsorSchema = z.object({
  name: z.string().min(1).max(255),
  logoUrl: z.string().optional().or(z.literal('')),
  description: z.string().optional(),
  link: z.string().url().optional().or(z.literal('')),
  contactEmail: z.string().email().optional().or(z.literal('')),
  tier: z.enum(['base', 'premium', 'gold']),
  prizeDescription: z.string().optional(),
  gameType: z.enum(['fortuna_italiana', 'fortuna_montelupo', 'gioco_poesie', 'tutti']),
  active: z.boolean().default(true)
});

export const UpdateSponsorSchema = CreateSponsorSchema.partial();

export const SponsorFilterSchema = z.object({
  tier: z.string().optional(),
  gameType: z.string().optional(),
  active: z.enum(['true', 'false']).optional(),
  limit: z.string().default('10').transform(Number),
  offset: z.string().default('0').transform(Number),
  sortBy: z.enum(['name', 'tier', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

export type CreateSponsorInput = z.infer<typeof CreateSponsorSchema>;
export type UpdateSponsorInput = z.infer<typeof UpdateSponsorSchema>;
export type SponsorFilter = z.infer<typeof SponsorFilterSchema>;
