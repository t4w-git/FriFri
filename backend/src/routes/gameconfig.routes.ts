import { Router, Request, Response, NextFunction } from 'express';
import { GameConfigService } from '../services/gameconfig.service.js';
import { requireRole } from '../middleware/auth.middleware.js';

const router = Router();
const gameConfigService = new GameConfigService();

// Get config for a specific game type
router.get('/:gameType', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gameType } = req.params;
    const config = await gameConfigService.getGameConfig(gameType);
    res.json(config);
  } catch (error) {
    next(error);
  }
});

// Get all configs
router.get('/', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const configs = await gameConfigService.getAllGameConfigs();
    res.json(configs);
  } catch (error) {
    next(error);
  }
});

// Update config (admin only)
router.put('/:id', requireRole(['admin']), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;
    const config = await gameConfigService.updateGameConfig(id, data);
    res.json(config);
  } catch (error) {
    next(error);
  }
});

// Create config (admin only)
router.post('/', requireRole(['admin']), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    const config = await gameConfigService.createGameConfig(data);
    res.json(config);
  } catch (error) {
    next(error);
  }
});

export default router;
