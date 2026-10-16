import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client.js';
import { CreatePoemSchema, UpdatePoemSchema, PoemFilterSchema } from '../schemas/poem.schema.js';
import { NotFoundError, ValidationError, InternalServerError } from '../utils/errors.js';
import { cacheService } from './cache.service.js';

const POEMS_CACHE_KEY = 'poems:*';
const POEM_CACHE_TTL = 5 * 60; // 5 minutes

/**
 * Combine 3 quartines (partA, partB, partC) into a single formatted poem text
 * with double newlines between each quartina for proper formatting
 */
function combineQuartinesIntoText(partA?: string, partB?: string, partC?: string): string {
  const parts = [partA, partB, partC].filter(p => p && p.trim().length > 0);
  return parts.join('\n\n');
}

export class PoemService {
  async createPoem(data: any) {
    try {
      const validated = CreatePoemSchema.parse(data);
      
      // Auto-generate text from quartines if they exist and text is not provided
      const text = validated.text || combineQuartinesIntoText(validated.partA, validated.partB, validated.partC);
      
      const poem = await prisma.poem.create({
        data: {
          ...validated,
          text, // Use auto-generated or provided text
          audioUrl: validated.audioUrl || null,
          thumbnailUrl: validated.thumbnailUrl || null,
          publishedDate: validated.publishedDate ? new Date(validated.publishedDate) : null
        }
      });
      // Invalidate poems cache
      await cacheService.invalidatePattern(POEMS_CACHE_KEY);
      return poem;
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw new ValidationError(error.errors?.[0]?.message || 'Invalid poem data');
      }
      throw new InternalServerError('Failed to create poem');
    }
  }

  async getPoems(filters: any) {
    try {
      const validated = PoemFilterSchema.parse(filters);
      
      // Create cache key based on filters
      const cacheKey = `poems:${JSON.stringify(validated)}`;
      const cached = await cacheService.get<any>(cacheKey);
      if (cached) return cached;
      
      const where: any = {};
      if (validated.active !== undefined) {
        where.active = validated.active === 'true';
      }
      if (validated.author) {
        where.author = { contains: validated.author, mode: 'insensitive' };
      }
      if (validated.search) {
        where.OR = [
          { title: { contains: validated.search, mode: 'insensitive' } },
          { text: { contains: validated.search, mode: 'insensitive' } }
        ];
      }

      const [data, total] = await Promise.all([
        prisma.poem.findMany({
          where,
          skip: validated.offset,
          take: validated.limit,
          orderBy: { [validated.sortBy]: validated.sortOrder }
        }),
        prisma.poem.count({ where })
      ]);

      const result = { data, total, limit: validated.limit, offset: validated.offset };
      
      // Cache result
      await cacheService.set(cacheKey, result, { ttl: POEM_CACHE_TTL });
      return result;
    } catch (error) {
      throw new InternalServerError('Failed to fetch poems');
    }
  }

  async getPoemById(id: string) {
    try {
      const cacheKey = `poem:${id}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;

      const poem = await prisma.poem.findUnique({ where: { id } });
      if (!poem) throw new NotFoundError('Poem', id);
      
      // Cache result
      await cacheService.set(cacheKey, poem, { ttl: POEM_CACHE_TTL });
      return poem;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to fetch poem');
    }
  }

  async updatePoem(id: string, data: any) {
    try {
      const validated = UpdatePoemSchema.parse(data);
      const poem = await prisma.poem.findUnique({ where: { id } });
      if (!poem) throw new NotFoundError('Poem', id);

      // Auto-generate text from quartines if they exist and text is not provided
      const text = validated.text || combineQuartinesIntoText(validated.partA, validated.partB, validated.partC);

      const updated = await prisma.poem.update({
        where: { id },
        data: {
          ...validated,
          text, // Use auto-generated or provided text
          publishedDate: validated.publishedDate ? new Date(validated.publishedDate) : undefined
        }
      });

      // Invalidate caches
      await cacheService.delete(`poem:${id}`);
      await cacheService.invalidatePattern(POEMS_CACHE_KEY);
      return updated;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to update poem');
    }
  }

  async deletePoem(id: string) {
    try {
      const poem = await prisma.poem.findUnique({ where: { id } });
      if (!poem) throw new NotFoundError('Poem', id);
      
      await prisma.poem.delete({ where: { id } });

      // Invalidate caches
      await cacheService.delete(`poem:${id}`);
      await cacheService.invalidatePattern(POEMS_CACHE_KEY);
      return poem;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to delete poem');
    }
  }
}

export const poemService = new PoemService();

// Routes
export const poemRouter = (app: any) => {
  app.post('/api/v1/poems', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const poem = await poemService.createPoem(req.body);
      res.status(201).json(poem);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/v1/poems', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await poemService.getPoems(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/v1/poems/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const poem = await poemService.getPoemById(req.params.id);
      res.json(poem);
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/v1/poems/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const poem = await poemService.updatePoem(req.params.id, req.body);
      res.json(poem);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/v1/poems/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await poemService.deletePoem(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
};
