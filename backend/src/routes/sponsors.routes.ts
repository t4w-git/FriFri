import { Router, Request, Response, NextFunction } from 'express';
import { sponsorService } from '../services/sponsor.service.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { CreateSponsorSchema, UpdateSponsorSchema, SponsorFilterSchema } from '../schemas/sponsor.schema.js';

const router = Router();

router.post('/', authMiddleware, requireRole(['admin']), validateRequest(CreateSponsorSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sponsor = await sponsorService.createSponsor(req.body);
    res.status(201).json(sponsor);
  } catch (error) {
    next(error);
  }
});

router.get('/', validateRequest(SponsorFilterSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sponsorService.getSponsors(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sponsor = await sponsorService.getSponsorById(req.params.id);
    res.json(sponsor);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, requireRole(['admin']), validateRequest(UpdateSponsorSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sponsor = await sponsorService.updateSponsor(req.params.id, req.body);
    res.json(sponsor);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, requireRole(['admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await sponsorService.deleteSponsor(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:id/view', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sponsor = await sponsorService.trackView(req.params.id);
    res.json(sponsor);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/play', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sponsor = await sponsorService.trackPlay(req.params.id);
    res.json(sponsor);
  } catch (error) {
    next(error);
  }
});

export default router;
