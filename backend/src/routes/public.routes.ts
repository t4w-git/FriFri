import { Router, Request, Response, NextFunction } from 'express';
import { poemService } from '../services/poem.service.js';
import { sponsorService } from '../services/sponsor.service.js';
import { emailService } from '../services/email.service.js';
import { SPONSOR_TIER_COLORS } from '../config/sponsorTiers.js';
import { prisma } from '../db/client.js';

const router = Router();

// Public poems list (supports filtering via query params)
router.get('/poems', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await poemService.getPoems(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Public poem details
router.get('/poems/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poem = await poemService.getPoemById(req.params.id);
    res.json(poem);
  } catch (error) {
    next(error);
  }
});

// Public sponsors list (supports filtering via query params)
router.get('/sponsors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sponsorService.getSponsors(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Public contact form
router.post('/contact', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, tier, message } = req.body;

    const subject = `Nuovo sponsor ${tier || ''}`.trim();
    const body = `Nome attività: ${name || 'N/A'}\nEmail: ${email || 'N/A'}\nTier: ${tier || 'N/A'}\nMessaggio:\n${message || ''}`;

    await emailService.sendAdminNotification(subject, body);

    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// Public sponsor tiers configuration (from database)
router.get('/sponsor-tiers', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tiers = await prisma.sponsorTier.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });

    // Merge database tiers with color configuration
    const tiersWithColors = tiers.map(tier => ({
      ...tier,
      ...SPONSOR_TIER_COLORS[tier.key as keyof typeof SPONSOR_TIER_COLORS],
    }));

    res.json(tiersWithColors);
  } catch (error) {
    next(error);
  }
});

export default router;
