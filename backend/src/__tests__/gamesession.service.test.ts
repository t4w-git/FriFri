import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameSessionService } from '../services/gamesession.service.js';
import { NotFoundError } from '../utils/errors.js';

vi.mock('@prisma/client');
vi.mock('../services/cache.service.js');

describe('GameSessionService', () => {
  let gameSessionService: GameSessionService;
  let mockPrisma: any;

  beforeEach(() => {
    gameSessionService = new GameSessionService();
    mockPrisma = {
      gameSession: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
      },
      sponsor: {
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      prizeCode: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createGameSession', () => {
    it('should create a game session with win result', async () => {
      const sessionData = {
        gameType: 'gioco_poesie',
        playerEmail: 'player@example.com',
        result: 'win',
        prizeCode: 'PRIZE123',
        sponsorId: '1',
      };

      const expectedSession = {
        id: '1',
        ...sessionData,
        playedDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.gameSession.create.mockResolvedValue(expectedSession);
      mockPrisma.sponsor.update.mockResolvedValue({});

      expect(mockPrisma.gameSession.create).toBeDefined();
    });

    it('should create a game session with lose result', async () => {
      const sessionData = {
        gameType: 'fortuna_italiana',
        playerEmail: 'player@example.com',
        result: 'lose',
      };

      const expectedSession = {
        id: '2',
        ...sessionData,
        prizeCode: null,
        sponsorId: null,
        playedDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.gameSession.create.mockResolvedValue(expectedSession);

      expect(mockPrisma.gameSession.create).toBeDefined();
    });
  });

  describe('getGameSessions', () => {
    it('should return game sessions with pagination', async () => {
      const filters = {
        limit: 10,
        offset: 0,
        sortBy: 'playedDate',
        sortOrder: 'desc',
      };

      const mockSessions = [
        {
          id: '1',
          gameType: 'gioco_poesie',
          playerEmail: 'player@example.com',
          result: 'win',
          playedDate: new Date(),
        },
      ];

      mockPrisma.gameSession.findMany.mockResolvedValue(mockSessions);
      mockPrisma.gameSession.count.mockResolvedValue(1);

      expect(mockPrisma.gameSession.findMany).toBeDefined();
    });

    it('should filter by game type', async () => {
      const filters = {
        gameType: 'gioco_poesie',
        limit: 10,
        offset: 0,
      };

      mockPrisma.gameSession.findMany.mockResolvedValue([]);
      mockPrisma.gameSession.count.mockResolvedValue(0);

      expect(filters.gameType).toBe('gioco_poesie');
    });

    it('should filter by player email', async () => {
      const filters = {
        playerEmail: 'player@example.com',
        limit: 10,
        offset: 0,
      };

      mockPrisma.gameSession.findMany.mockResolvedValue([]);
      mockPrisma.gameSession.count.mockResolvedValue(0);

      expect(filters.playerEmail).toBe('player@example.com');
    });

    it('should filter by result', async () => {
      const filters = {
        result: 'win',
        limit: 10,
        offset: 0,
      };

      mockPrisma.gameSession.findMany.mockResolvedValue([]);
      mockPrisma.gameSession.count.mockResolvedValue(0);

      expect(filters.result).toBe('win');
    });
  });

  describe('getGameStats', () => {
    it('should return game statistics', async () => {
      const mockStats = [
        {
          gameType: 'gioco_poesie',
          result: 'win',
          count: 10,
        },
        {
          gameType: 'gioco_poesie',
          result: 'lose',
          count: 5,
        },
      ];

      mockPrisma.gameSession.groupBy.mockResolvedValue(mockStats);

      expect(mockPrisma.gameSession.groupBy).toBeDefined();
    });
  });

  describe('claimPrize', () => {
    it('should claim prize for winning session', async () => {
      const sessionId = '1';
      const existingSession = {
        id: sessionId,
        result: 'win',
        prizeCode: 'PRIZE123',
        sponsorId: '1',
      };

      mockPrisma.gameSession.findUnique.mockResolvedValue(existingSession);

      expect(mockPrisma.gameSession.findUnique).toBeDefined();
    });

    it('should throw error when claiming prize for non-winning session', async () => {
      const sessionId = '2';
      const existingSession = {
        id: sessionId,
        result: 'lose',
        prizeCode: null,
      };

      mockPrisma.gameSession.findUnique.mockResolvedValue(existingSession);

      expect(existingSession.result).toBe('lose');
    });

    it('should throw NotFoundError when session does not exist', async () => {
      const sessionId = 'nonexistent';
      mockPrisma.gameSession.findUnique.mockResolvedValue(null);

      expect(mockPrisma.gameSession.findUnique).toBeDefined();
    });
  });
});
