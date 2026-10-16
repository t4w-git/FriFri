import { Router, Request, Response, NextFunction } from 'express';
import { prizeCodeService } from '../services/prizecode.service.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { adminLimiter } from '../middleware/rateLimit.middleware.js';
import { CreatePrizeCodeSchema, PrizeCodeFilterSchema } from '../schemas/prizecode.schema.js';

const router = Router();

// Public endpoints (no auth required for email links)
// Mark prize code as claimed by player via email link
router.get('/:code/mark-claimed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prizeCode = await prizeCodeService.markPrizeCodeClaimed(req.params.code);
    
    // Return HTML response for email link click
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Riscatto Confermato</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 50px auto; background: white; padding: 40px; border-radius: 8px; text-align: center; }
          h1 { color: #C4956A; }
          .success { color: #28a745; }
          .code { background: #F8F7F5; padding: 20px; border-radius: 6px; font-family: monospace; font-size: 18px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✓ Riscatto Confermato</h1>
          <p class="success">Hai confermato il riscatto del tuo premio!</p>
          <div class="code">${prizeCode.code}</div>
          <p style="color: #666; font-size: 14px;">Presenta questo codice presso il locale per ritirare il tuo premio. Lo staff dello sponsor confermerà il riscatto nel nostro sistema.</p>
        </div>
      </body>
      </html>
    `;
    
    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    next(error);
  }
});

// Mark prize code as redeemed by sponsor via email link
router.get('/:code/mark-redeemed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prizeCode = await prizeCodeService.markPrizeCodeRedeemed(req.params.code);
    
    // Return HTML response for email link click
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Codice Riscattato</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 50px auto; background: white; padding: 40px; border-radius: 8px; text-align: center; }
          h1 { color: #C4956A; }
          .success { color: #28a745; }
          .code { background: #F8F7F5; padding: 20px; border-radius: 6px; font-family: monospace; font-size: 18px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✓ Codice Riscattato</h1>
          <p class="success">Il premio è stato confermato come riscattato nel nostro sistema.</p>
          <div class="code">${prizeCode.code}</div>
          <p style="color: #666; font-size: 14px;">Questa pagina può essere chiusa. Nel pannello admin il codice risulterà come riscattato.</p>
        </div>
      </body>
      </html>
    `;
    
    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    next(error);
  }
});

// Protected endpoints (admin only)
router.post('/', authMiddleware, requireRole(['admin']), adminLimiter, validateRequest(CreatePrizeCodeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prizeCode = await prizeCodeService.createPrizeCode(req.body);
    res.status(201).json(prizeCode);
  } catch (error) {
    next(error);
  }
});

router.get('/', authMiddleware, requireRole(['admin']), adminLimiter, validateRequest(PrizeCodeFilterSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prizeCodeService.getPrizeCodes(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/code/:code', authMiddleware, requireRole(['admin']), adminLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prizeCode = await prizeCodeService.getPrizeCodeByCode(req.params.code);
    res.json(prizeCode);
  } catch (error) {
    next(error);
  }
});

router.get('/code/:code/redeem', authMiddleware, requireRole(['admin']), adminLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    // Verify sponsor ownership if not admin
    if (user.role !== 'admin') {
      const prizeCode = await prizeCodeService.getPrizeCodeByCode(req.params.code);
      if (prizeCode.sponsorId !== user.sponsorId) {
        res.status(403).json({ error: 'You can only access prize codes from your organization' });
        return;
      }
    }
    
    // GET returns the prize code info for verification
    const prizeCode = await prizeCodeService.getPrizeCodeByCode(req.params.code);
    res.json(prizeCode);
  } catch (error) {
    next(error);
  }
});

router.post('/code/:code/redeem', authMiddleware, requireRole(['admin']), adminLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = (req as any).user;
    
    // Determine authorization: admin or sponsor
    let sponsorIdOrAdmin: string | undefined = undefined;
    if (user.role === 'admin') {
      sponsorIdOrAdmin = 'admin';
    } else if (user.role === 'sponsor') {
      sponsorIdOrAdmin = user.sponsorId; // Sponsor can only redeem their own codes
    } else {
      res.status(403).json({ error: 'Only admin or sponsor can redeem prize codes' });
      return;
    }
    
    const prizeCode = await prizeCodeService.redeemPrizeCode(req.params.code, email, sponsorIdOrAdmin);
    res.json(prizeCode);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, requireRole(['admin']), adminLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prizeCodeService.deletePrizeCode(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, requireRole(['admin']), adminLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prizeCode = await prizeCodeService.updatePrizeCode(req.params.id, req.body);
    res.json(prizeCode);
  } catch (error) {
    next(error);
  }
});

export default router;
