import { Router, Request, Response, NextFunction } from 'express';
import { poemService } from '../services/poem.service.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { CreatePoemSchema, UpdatePoemSchema, PoemFilterSchema } from '../schemas/poem.schema.js';

const router = Router();

router.post('/', authMiddleware, requireRole(['admin']), validateRequest(CreatePoemSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poem = await poemService.createPoem(req.body);
    res.status(201).json(poem);
  } catch (error) {
    next(error);
  }
});

router.get('/', validateRequest(PoemFilterSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await poemService.getPoems(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poem = await poemService.getPoemById(req.params.id);
    res.json(poem);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, requireRole(['admin']), validateRequest(UpdatePoemSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poem = await poemService.updatePoem(req.params.id, req.body);
    res.json(poem);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, requireRole(['admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await poemService.deletePoem(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/featured', authMiddleware, requireRole(['admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { featured } = req.body;
    const poem = await poemService.updatePoem(req.params.id, { featured });
    res.json(poem);
  } catch (error) {
    next(error);
  }
});

export default router;
