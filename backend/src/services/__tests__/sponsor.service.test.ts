import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { sponsorService } from '../services/sponsor.service.js';
import { NotFoundError } from '../utils/errors.js';

const prisma = new PrismaClient();

describe('SponsorService', () => {
  let sponsorId: string;

  beforeAll(async () => {
    await prisma.sponsor.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('createSponsor', () => {
    it('should create a sponsor with valid data', async () => {
      const data = {
        name: 'Test Sponsor',
        tier: 'premium',
        gameType: 'tutti',
        active: true
      };

      const result = await sponsorService.createSponsor(data);
      sponsorId = result.id;
      expect(result).toBeDefined();
      expect(result.name).toBe('Test Sponsor');
      expect(result.views).toBe(0);
    });
  });

  describe('trackView', () => {
    it('should increment sponsor views', async () => {
      const result = await sponsorService.trackView(sponsorId);
      expect(result.views).toBe(1);
    });
  });

  describe('getSponsorById', () => {
    it('should throw NotFoundError for non-existent sponsor', async () => {
      expect(() => sponsorService.getSponsorById('non-existent')).rejects.toThrow(NotFoundError);
    });
  });
});
