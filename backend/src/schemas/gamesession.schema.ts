import { z } from 'zod';

export const CreateGameSessionSchema = z.object({
  gameType: z.enum(['gioco_poesie', 'fortuna_italiana', 'fortuna_montelupo']),
  playerEmail: z.string().email(),
  result: z.enum(['win', 'lose']),
  prizeCode: z.string().optional(),
  sponsorId: z.string().cuid().optional(),
  playedDate: z.string().datetime().optional()
});

export const GameSessionFilterSchema = z.object({
  gameType: z.string().optional(),
  playerEmail: z.string().optional(),
  result: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.string().default('10').transform(Number),
  offset: z.string().default('0').transform(Number),
  sortBy: z.enum(['playedDate', 'createdAt']).default('playedDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export type CreateGameSessionInput = z.infer<typeof CreateGameSessionSchema>;
export type GameSessionFilter = z.infer<typeof GameSessionFilterSchema>;
