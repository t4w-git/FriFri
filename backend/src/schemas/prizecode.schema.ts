import { z } from 'zod';

export const CreatePrizeCodeSchema = z.object({
  code: z.string().min(1).max(50),
  sponsorId: z.string().cuid(),
  sponsorName: z.string().max(255),
  gameType: z.string().optional(),
  playerEmail: z.string().email().optional(),
  prizeDescription: z.string().optional(),
  redeemed: z.boolean().default(false)
});

export const UpdatePrizeCodeSchema = CreatePrizeCodeSchema.partial().extend({
  redeemed: z.boolean().optional(),
  redeemedDate: z.string().datetime().optional()
});

export const PrizeCodeFilterSchema = z.object({
  redeemed: z.enum(['true', 'false']).optional(),
  sponsorId: z.string().optional(),
  playerEmail: z.string().optional(),
  limit: z.string().default('10').transform(Number),
  offset: z.string().default('0').transform(Number)
});

export type CreatePrizeCodeInput = z.infer<typeof CreatePrizeCodeSchema>;
export type UpdatePrizeCodeInput = z.infer<typeof UpdatePrizeCodeSchema>;
export type PrizeCodeFilter = z.infer<typeof PrizeCodeFilterSchema>;
