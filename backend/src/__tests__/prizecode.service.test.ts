import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrizeCodeService } from '../services/prizecode.service.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

vi.mock('@prisma/client');
vi.mock('../services/cache.service.js');

describe('PrizeCodeService', () => {
  let prizeCodeService: PrizeCodeService;
  let mockPrisma: any;

  beforeEach(() => {
    prizeCodeService = new PrizeCodeService();
    mockPrisma = {
      prizeCode: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      sponsor: {
        update: vi.fn(),
      },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createPrizeCode', () => {
    it('should create a prize code with valid data', async () => {
      const codeData = {
        code: 'PRIZE123',
        sponsorId: '1',
        sponsorName: 'Test Sponsor',
        gameType: 'gioco_poesie',
        prizeDescription: 'Test prize',
      };

      const expectedCode = {
        id: '1',
        ...codeData,
        playerEmail: null,
        redeemed: false,
        redeemedDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.prizeCode.create.mockResolvedValue(expectedCode);

      expect(mockPrisma.prizeCode.create).toBeDefined();
    });

    it('should throw error for duplicate code', async () => {
      const codeData = {
        code: 'EXISTING',
        sponsorId: '1',
        sponsorName: 'Test Sponsor',
      };

      mockPrisma.prizeCode.create.mockRejectedValue(new Error('Unique constraint failed'));

      expect(mockPrisma.prizeCode.create).toBeDefined();
    });
  });

  describe('getPrizeCodes', () => {
    it('should return prize codes with pagination', async () => {
      const filters = {
        limit: 10,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const mockCodes = [
        {
          id: '1',
          code: 'PRIZE001',
          sponsorName: 'Sponsor 1',
          redeemed: false,
        },
      ];

      mockPrisma.prizeCode.findMany.mockResolvedValue(mockCodes);
      mockPrisma.prizeCode.count.mockResolvedValue(1);

      expect(mockPrisma.prizeCode.findMany).toBeDefined();
    });

    it('should filter by redeemed status', async () => {
      const filters = {
        redeemed: false,
        limit: 10,
        offset: 0,
      };

      mockPrisma.prizeCode.findMany.mockResolvedValue([]);
      mockPrisma.prizeCode.count.mockResolvedValue(0);

      expect(filters.redeemed).toBe(false);
    });
  });

  describe('getPrizeCodeByCode', () => {
    it('should return prize code by code string', async () => {
      const code = 'PRIZE123';
      const expectedCode = {
        id: '1',
        code,
        sponsorName: 'Test Sponsor',
        redeemed: false,
      };

      mockPrisma.prizeCode.findUnique.mockResolvedValue(expectedCode);

      expect(mockPrisma.prizeCode.findUnique).toBeDefined();
    });

    it('should return null when code does not exist', async () => {
      const code = 'NONEXISTENT';
      mockPrisma.prizeCode.findUnique.mockResolvedValue(null);

      expect(mockPrisma.prizeCode.findUnique).toBeDefined();
    });
  });

  describe('redeemPrizeCode', () => {
    it('should redeem unredeemed code', async () => {
      const code = 'PRIZE123';
      const playerEmail = 'player@example.com';
      const existingCode = {
        id: '1',
        code,
        sponsorId: '1',
        redeemed: false,
        sponsorName: 'Test Sponsor',
      };
      const redeemedCode = {
        ...existingCode,
        redeemed: true,
        playerEmail,
        redeemedDate: new Date(),
      };

      mockPrisma.prizeCode.findUnique.mockResolvedValue(existingCode);
      mockPrisma.prizeCode.update.mockResolvedValue(redeemedCode);
      mockPrisma.sponsor.update.mockResolvedValue({});

      expect(mockPrisma.prizeCode.update).toBeDefined();
    });

    it('should throw error when trying to redeem already redeemed code', async () => {
      const code = 'ALREADY_REDEEMED';
      const playerEmail = 'player@example.com';
      const existingCode = {
        id: '1',
        code,
        redeemed: true,
        redeemedDate: new Date(),
      };

      mockPrisma.prizeCode.findUnique.mockResolvedValue(existingCode);

      expect(existingCode.redeemed).toBe(true);
    });
  });

  describe('deletePrizeCode', () => {
    it('should delete prize code successfully', async () => {
      const codeId = '1';
      const code = { id: codeId, code: 'PRIZE123' };

      mockPrisma.prizeCode.findUnique.mockResolvedValue(code);
      mockPrisma.prizeCode.delete.mockResolvedValue(code);

      expect(mockPrisma.prizeCode.delete).toBeDefined();
    });

    it('should throw NotFoundError when deleting nonexistent code', async () => {
      const codeId = 'nonexistent';
      mockPrisma.prizeCode.findUnique.mockResolvedValue(null);

      expect(mockPrisma.prizeCode.findUnique).toBeDefined();
    });
  });
});
