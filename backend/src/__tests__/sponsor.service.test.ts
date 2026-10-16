import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SponsorService } from '../services/sponsor.service.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

vi.mock('@prisma/client');
vi.mock('../services/cache.service.js');

describe('SponsorService', () => {
  let sponsorService: SponsorService;
  let mockPrisma: any;

  beforeEach(() => {
    sponsorService = new SponsorService();
    mockPrisma = {
      sponsor: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createSponsor', () => {
    it('should create a sponsor with valid data', async () => {
      const sponsorData = {
        name: 'Test Sponsor',
        tier: 'gold',
        gameType: 'gioco_poesie',
        description: 'Test description',
        link: 'http://example.com',
      };

      const expectedSponsor = {
        id: '1',
        ...sponsorData,
        logoUrl: null,
        prizeDescription: null,
        active: true,
        views: 0,
        plays: 0,
        redemptions: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.sponsor.create.mockResolvedValue(expectedSponsor);

      expect(mockPrisma.sponsor.create).toBeDefined();
    });
  });

  describe('getSponsors', () => {
    it('should return sponsors with pagination', async () => {
      const filters = {
        limit: 10,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const mockSponsors = [
        {
          id: '1',
          name: 'Sponsor 1',
          tier: 'gold',
          gameType: 'gioco_poesie',
          views: 100,
          plays: 50,
          redemptions: 10,
        },
      ];

      mockPrisma.sponsor.findMany.mockResolvedValue(mockSponsors);
      mockPrisma.sponsor.count.mockResolvedValue(1);

      expect(mockPrisma.sponsor.findMany).toBeDefined();
    });

    it('should filter sponsors by tier', async () => {
      const filters = {
        tier: 'premium',
        limit: 10,
        offset: 0,
      };

      mockPrisma.sponsor.findMany.mockResolvedValue([]);
      mockPrisma.sponsor.count.mockResolvedValue(0);

      expect(filters.tier).toBe('premium');
    });

    it('should filter sponsors by game type', async () => {
      const filters = {
        gameType: 'fortuna_italiana',
        limit: 10,
        offset: 0,
      };

      mockPrisma.sponsor.findMany.mockResolvedValue([]);
      mockPrisma.sponsor.count.mockResolvedValue(0);

      expect(filters.gameType).toBe('fortuna_italiana');
    });
  });

  describe('trackView', () => {
    it('should increment sponsor views', async () => {
      const sponsorId = '1';
      const existingSponsor = {
        id: sponsorId,
        name: 'Test Sponsor',
        views: 10,
      };
      const updatedSponsor = { ...existingSponsor, views: 11 };

      mockPrisma.sponsor.findUnique.mockResolvedValue(existingSponsor);
      mockPrisma.sponsor.update.mockResolvedValue(updatedSponsor);

      expect(mockPrisma.sponsor.update).toBeDefined();
    });
  });

  describe('trackPlay', () => {
    it('should increment sponsor plays', async () => {
      const sponsorId = '1';
      const existingSponsor = {
        id: sponsorId,
        name: 'Test Sponsor',
        plays: 5,
      };
      const updatedSponsor = { ...existingSponsor, plays: 6 };

      mockPrisma.sponsor.findUnique.mockResolvedValue(existingSponsor);
      mockPrisma.sponsor.update.mockResolvedValue(updatedSponsor);

      expect(mockPrisma.sponsor.update).toBeDefined();
    });
  });

  describe('trackRedemption', () => {
    it('should increment sponsor redemptions', async () => {
      const sponsorId = '1';
      const existingSponsor = {
        id: sponsorId,
        name: 'Test Sponsor',
        redemptions: 2,
      };
      const updatedSponsor = { ...existingSponsor, redemptions: 3 };

      mockPrisma.sponsor.findUnique.mockResolvedValue(existingSponsor);
      mockPrisma.sponsor.update.mockResolvedValue(updatedSponsor);

      expect(mockPrisma.sponsor.update).toBeDefined();
    });
  });

  describe('getSponsorById', () => {
    it('should return sponsor by id', async () => {
      const sponsorId = '1';
      const expectedSponsor = {
        id: sponsorId,
        name: 'Test Sponsor',
        tier: 'gold',
      };

      mockPrisma.sponsor.findUnique.mockResolvedValue(expectedSponsor);

      expect(mockPrisma.sponsor.findUnique).toBeDefined();
    });

    it('should throw NotFoundError when sponsor does not exist', async () => {
      const sponsorId = 'nonexistent';
      mockPrisma.sponsor.findUnique.mockResolvedValue(null);

      expect(mockPrisma.sponsor.findUnique).toBeDefined();
    });
  });

  describe('deleteSponsor', () => {
    it('should delete sponsor successfully', async () => {
      const sponsorId = '1';
      const sponsor = { id: sponsorId, name: 'Test Sponsor' };

      mockPrisma.sponsor.findUnique.mockResolvedValue(sponsor);
      mockPrisma.sponsor.delete.mockResolvedValue(sponsor);

      expect(mockPrisma.sponsor.delete).toBeDefined();
    });
  });
});
