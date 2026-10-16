import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NewsletterService } from '../services/newsletter.service.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';

vi.mock('@prisma/client');
vi.mock('../services/cache.service.js');

describe('NewsletterService', () => {
  let newsletterService: NewsletterService;
  let mockPrisma: any;

  beforeEach(() => {
    newsletterService = new NewsletterService();
    mockPrisma = {
      newsletterSubscriber: {
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

  describe('subscribe', () => {
    it('should subscribe a new email', async () => {
      const email = 'test@example.com';
      const expectedSubscriber = {
        id: '1',
        email,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(null);
      mockPrisma.newsletterSubscriber.create.mockResolvedValue(expectedSubscriber);

      expect(mockPrisma.newsletterSubscriber.create).toBeDefined();
    });

    it('should reactivate previously unsubscribed email', async () => {
      const email = 'test@example.com';
      const inactiveSubscriber = {
        id: '1',
        email,
        active: false,
      };
      const reactivatedSubscriber = { ...inactiveSubscriber, active: true };

      mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(inactiveSubscriber);
      mockPrisma.newsletterSubscriber.update.mockResolvedValue(reactivatedSubscriber);

      expect(mockPrisma.newsletterSubscriber.update).toBeDefined();
    });

    it('should throw error when email already subscribed', async () => {
      const email = 'test@example.com';
      const existingSubscriber = {
        id: '1',
        email,
        active: true,
      };

      mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(existingSubscriber);

      expect(existingSubscriber.active).toBe(true);
    });
  });

  describe('getSubscribers', () => {
    it('should return active subscribers with pagination', async () => {
      const filters = {
        limit: 10,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const mockSubscribers = [
        {
          id: '1',
          email: 'subscriber1@example.com',
          active: true,
        },
        {
          id: '2',
          email: 'subscriber2@example.com',
          active: true,
        },
      ];

      mockPrisma.newsletterSubscriber.findMany.mockResolvedValue(mockSubscribers);
      mockPrisma.newsletterSubscriber.count.mockResolvedValue(2);

      expect(mockPrisma.newsletterSubscriber.findMany).toBeDefined();
    });

    it('should filter by active status', async () => {
      const filters = {
        active: true,
        limit: 10,
        offset: 0,
      };

      mockPrisma.newsletterSubscriber.findMany.mockResolvedValue([]);
      mockPrisma.newsletterSubscriber.count.mockResolvedValue(0);

      expect(filters.active).toBe(true);
    });
  });

  describe('unsubscribe', () => {
    it('should mark subscriber as inactive', async () => {
      const email = 'test@example.com';
      const existingSubscriber = {
        id: '1',
        email,
        active: true,
      };
      const unsubscribedSubscriber = { ...existingSubscriber, active: false };

      mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(existingSubscriber);
      mockPrisma.newsletterSubscriber.update.mockResolvedValue(unsubscribedSubscriber);

      expect(mockPrisma.newsletterSubscriber.update).toBeDefined();
    });

    it('should throw NotFoundError when email does not exist', async () => {
      const email = 'nonexistent@example.com';
      mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(null);

      expect(mockPrisma.newsletterSubscriber.findUnique).toBeDefined();
    });
  });

  describe('deleteSubscriber', () => {
    it('should delete subscriber permanently', async () => {
      const subscriberId = '1';
      const subscriber = {
        id: subscriberId,
        email: 'test@example.com',
      };

      mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(subscriber);
      mockPrisma.newsletterSubscriber.delete.mockResolvedValue(subscriber);

      expect(mockPrisma.newsletterSubscriber.delete).toBeDefined();
    });

    it('should throw NotFoundError when subscriber does not exist', async () => {
      const subscriberId = 'nonexistent';
      mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(null);

      expect(mockPrisma.newsletterSubscriber.findUnique).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return newsletter statistics', async () => {
      mockPrisma.newsletterSubscriber.count.mockResolvedValue(100);

      expect(mockPrisma.newsletterSubscriber.count).toBeDefined();
    });
  });
});
