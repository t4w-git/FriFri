import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../db/client.js';
import { gameSessionService } from '../services/gamesession.service.js';
import { newsletterService } from '../services/newsletter.service.js';
import { emailService } from '../services/email.service.js';
import { gameConfigService } from '../services/gameconfig.service.js';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Get dashboard with comprehensive stats
router.get('/dashboard', authMiddleware, requireRole(['admin']), async (_req: any, res: any, next: any) => {
  try {
    const [gameStats, newsletterStats, sponsorStats, poemStats] = await Promise.all([
      gameSessionService.getGameStats(),
      newsletterService.getStats(),
      prisma.sponsor.findMany({
        select: {
          id: true,
          name: true,
          tier: true,
          views: true,
          plays: true,
          redemptions: true,
        },
        orderBy: { plays: 'desc' },
        take: 10,
      }),
      prisma.poem.count({ where: { active: true } }),
    ]);

    const totalGameSessions = await prisma.gameSession.count();
    const winCount = await prisma.gameSession.count({ where: { result: 'win' } });
    const loseCount = await prisma.gameSession.count({ where: { result: 'lose' } });

    res.json({
      summary: {
        totalGameSessions,
        wins: winCount,
        losses: loseCount,
        winRate: totalGameSessions > 0 ? ((winCount / totalGameSessions) * 100).toFixed(2) + '%' : '0%',
        activePoems: poemStats,
        subscribers: newsletterStats,
      },
      sponsorPerformance: sponsorStats,
      gameStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// Bulk deactivate poems
router.post('/bulk/poems/deactivate', authMiddleware, requireRole(['admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { poemIds } = req.body;

    if (!Array.isArray(poemIds) || poemIds.length === 0) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'poemIds must be a non-empty array' } });
      return;
    }

    const result = await prisma.poem.updateMany({
      where: { id: { in: poemIds } },
      data: { active: false },
    });

    res.json({ message: 'Poems deactivated', count: result.count });
  } catch (error) {
    next(error);
  }
});

// Bulk activate poems
router.post('/bulk/poems/activate', authMiddleware, requireRole(['admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { poemIds } = req.body;

    if (!Array.isArray(poemIds) || poemIds.length === 0) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'poemIds must be a non-empty array' } });
      return;
    }

    const result = await prisma.poem.updateMany({
      where: { id: { in: poemIds } },
      data: { active: true },
    });

    res.json({ message: 'Poems activated', count: result.count });
  } catch (error) {
    next(error);
  }
});

// Get sponsor performance report
router.get('/reports/sponsors', authMiddleware, requireRole(['admin']), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sponsors = await prisma.sponsor.findMany({
      select: {
        id: true,
        name: true,
        tier: true,
        views: true,
        plays: true,
        redemptions: true,
        active: true,
        createdAt: true,
      },
      orderBy: { plays: 'desc' },
    });

    const totalSponsors = sponsors.length;
    const totalViews = sponsors.reduce((sum, s) => sum + s.views, 0);
    const totalPlays = sponsors.reduce((sum, s) => sum + s.plays, 0);
    const totalRedemptions = sponsors.reduce((sum, s) => sum + s.redemptions, 0);

    res.json({
      summary: {
        totalSponsors,
        totalViews,
        totalPlays,
        totalRedemptions,
        averagePlaysPerSponsor: (totalPlays / totalSponsors).toFixed(2),
        averageRedemptionsPerSponsor: (totalRedemptions / totalSponsors).toFixed(2),
      },
      sponsors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// Get game analytics report
router.get('/reports/games', authMiddleware, requireRole(['admin']), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const gameStats = await gameSessionService.getGameStats();

    const gameTypeStats = await Promise.all([
      prisma.gameSession.count({ where: { gameType: 'gioco_poesie' } }),
      prisma.gameSession.count({ where: { gameType: 'fortuna_italiana' } }),
      prisma.gameSession.count({ where: { gameType: 'fortuna_montelupo' } }),
    ]);

    res.json({
      summary: {
        gioco_poesie: gameTypeStats[0],
        fortuna_italiana: gameTypeStats[1],
        fortuna_montelupo: gameTypeStats[2],
      },
      stats: gameStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// Get newsletter report
router.get('/reports/newsletter', authMiddleware, requireRole(['admin']), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const totalSubscribers = await prisma.newsletterSubscriber.count();
    const activeSubscribers = await prisma.newsletterSubscriber.count({ where: { active: true } });
    const inactiveSubscribers = totalSubscribers - activeSubscribers;

    const recentSubscriptions = await prisma.newsletterSubscriber.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { email: true, createdAt: true },
    });

    res.json({
      summary: {
        totalSubscribers,
        activeSubscribers,
        inactiveSubscribers,
        engagementRate: ((activeSubscribers / totalSubscribers) * 100).toFixed(2) + '%',
      },
      recentSubscriptions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// Send newsletter to all active subscribers (admin only)
router.post('/newsletter/send', authMiddleware, requireRole(['admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject, body } = req.body;
    if (!subject || !body) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'subject and body are required' } });
      return;
    }

    const result = await newsletterService.sendNewsletter(subject, body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Generate weekly poem HTML for newsletter preview
router.post('/newsletter/generate-poem-html', authMiddleware, requireRole(['admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { poemId } = req.body;
    if (!poemId) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'poemId is required' } });
      return;
    }

    const poem = await prisma.poem.findUnique({ where: { id: poemId } });
    if (!poem) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Poem not found' } });
      return;
    }

    const html = await emailService.generateWeeklyPoemHtml({
      title: poem.title,
      text: poem.text,
      author: poem.author || 'Autore sconosciuto',
    });

    res.json({ html, subject: `📖 La Poesia della Settimana: ${poem.title}` });
  } catch (error) {
    next(error);
  }
});

// Delete old game sessions (archival)
router.post('/archive/game-sessions', authMiddleware, requireRole(['admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days } = req.body;

    if (!days || typeof days !== 'number' || days < 1) {
      res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'days must be a positive number' },
      });
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const count = await prisma.gameSession.count({
      where: { playedDate: { lt: cutoffDate } },
    });

    // Note: Actual archival should be implemented
    // This just counts and demonstrates the endpoint
    res.json({
      message: `Found ${count} game sessions older than ${days} days`,
      cutoffDate,
      archivedCount: 0, // Implement actual archival
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// Game Config Management Routes
// Get all game configurations
router.get('/game-configs', authMiddleware, requireRole(['admin']), async (_req: any, res: any, next: any) => {
  try {
    const configs = await gameConfigService.getAllConfigs();
    res.json({
      configs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// Get specific game configuration
router.get('/game-configs/:gameType', authMiddleware, requireRole(['admin']), async (req: any, res: any, next: any) => {
  try {
    const { gameType } = req.params;
    const config = await gameConfigService.getGameConfig(gameType);
    res.json(config);
  } catch (error) {
    next(error);
  }
});

// Update game configuration
router.post('/game-config', authMiddleware, requireRole(['admin']), async (req: any, res: any, next: any) => {
  try {
    let { gameType, attemptsPerDay, cooldownMinutes, dailyResetHour, description, active, winEveryXAttempts, questionsPerGame, questionsToWin, questionsTimeoutSeconds } = req.body;

    // Normalize gameType to lowercase
    gameType = gameType?.toLowerCase?.();

    if (!gameType) {
      return res.status(400).json({ message: 'gameType is required' });
    }
    if (!attemptsPerDay && attemptsPerDay !== 0) {
      return res.status(400).json({ message: 'attemptsPerDay is required' });
    }
    if (cooldownMinutes === undefined) {
      return res.status(400).json({ message: 'cooldownMinutes is required' });
    }
    if (!dailyResetHour && dailyResetHour !== 0) {
      return res.status(400).json({ message: 'dailyResetHour is required' });
    }

    const updated = await gameConfigService.upsertGameConfig({
      gameType,
      attemptsPerDay,
      cooldownMinutes,
      dailyResetHour,
      description,
      active: active !== undefined ? active : true,
      winEveryXAttempts,
      questionsPerGame,
      questionsToWin,
      questionsTimeoutSeconds,
    });

    res.json({
      message: 'Game configuration updated successfully',
      config: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.put('/game-configs/:gameType', authMiddleware, requireRole(['admin']), async (req: any, res: any, next: any) => {
  try {
    const { gameType } = req.params;
    const { attemptsPerDay, cooldownMinutes, dailyResetHour, description, active } = req.body;

    if (!attemptsPerDay && attemptsPerDay !== 0) {
      return res.status(400).json({ message: 'attemptsPerDay is required' });
    }
    if (cooldownMinutes === undefined) {
      return res.status(400).json({ message: 'cooldownMinutes is required' });
    }
    if (!dailyResetHour && dailyResetHour !== 0) {
      return res.status(400).json({ message: 'dailyResetHour is required' });
    }

    const updated = await gameConfigService.upsertGameConfig({
      gameType,
      attemptsPerDay,
      cooldownMinutes,
      dailyResetHour,
      description,
      active: active !== undefined ? active : true,
    });

    res.json({
      message: 'Game configuration updated successfully',
      config: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// Initialize default configurations
router.post('/game-configs/init/defaults', authMiddleware, requireRole(['admin']), async (_req: any, res: any, next: any) => {
  try {
    await gameConfigService.initializeDefaults();
    const configs = await gameConfigService.getAllConfigs();
    res.json({
      message: 'Default game configurations initialized',
      configs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// Check player attempts status (admin endpoint for monitoring)
router.get('/player-attempts/:email/:gameType', authMiddleware, requireRole(['admin']), async (req: any, res: any, next: any) => {
  try {
    const { email, gameType } = req.params;
    const status = await gameConfigService.checkAttemptsStatus(email, gameType, '');
    res.json({
      email,
      gameType,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// Get all sponsor tiers (admin)
router.get('/sponsor-tiers', authMiddleware, requireRole(['admin']), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tiers = await prisma.sponsorTier.findMany({
      orderBy: { order: 'asc' },
    });
    res.json(tiers);
  } catch (error) {
    next(error);
  }
});

// Update sponsor tier (admin)
router.put('/sponsor-tiers/:id', authMiddleware, requireRole(['admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { label, price, features, popular, active } = req.body;

    const tier = await prisma.sponsorTier.update({
      where: { id },
      data: {
        ...(label && { label }),
        ...(price !== undefined && { price }),
        ...(features && { features }),
        ...(popular !== undefined && { popular }),
        ...(active !== undefined && { active }),
      },
    });

    res.json(tier);
  } catch (error) {
    next(error);
  }
});

export default router;
