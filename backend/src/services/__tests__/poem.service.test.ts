import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { poemService } from '../services/poem.service.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const prisma = new PrismaClient();

describe('PoemService', () => {
  beforeAll(async () => {
    await prisma.poem.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('createPoem', () => {
    it('should create a poem with valid data', async () => {
      const data = {
        title: 'Test Poem',
        text: 'Test poem content',
        author: 'Test Author',
        active: true
      };

      const result = await poemService.createPoem(data);
      expect(result).toBeDefined();
      expect(result.title).toBe('Test Poem');
      expect(result.author).toBe('Test Author');
    });

    it('should throw ValidationError for invalid data', async () => {
      const data = {
        title: '',
        text: ''
      };

      expect(() => poemService.createPoem(data)).rejects.toThrow(ValidationError);
    });
  });

  describe('getPoems', () => {
    it('should return list of poems', async () => {
      const result = await poemService.getPoems({ active: 'true' });
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getPoemById', () => {
    it('should throw NotFoundError for non-existent poem', async () => {
      expect(() => poemService.getPoemById('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });
});
