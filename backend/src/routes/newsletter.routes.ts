import { Router, Request, Response, NextFunction } from 'express';
import { newsletterService } from '../services/newsletter.service.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { CreateNewsletterSubscriberSchema, NewsletterFilterSchema } from '../schemas/newsletter.schema.js';

const router = Router();

router.post('/subscribe', validateRequest(CreateNewsletterSubscriberSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscriber = await newsletterService.subscribe(req.body);
    res.status(201).json(subscriber);
  } catch (error) {
    next(error);
  }
});

router.get('/', authMiddleware, requireRole(['admin']), validateRequest(NewsletterFilterSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await newsletterService.getSubscribers(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/unsubscribe', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const email = req.body.email as string;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const subscriber = await newsletterService.unsubscribe(email);
    res.json(subscriber);
  } catch (error) {
    next(error);
  }
});

router.get('/unsubscribe', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const email = req.query.email as string;
    if (!email) {
      res.status(400).json({ error: 'Email parameter required' });
      return;
    }
    await newsletterService.unsubscribe(email);
    
    // Return HTML confirmation page
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Iscrizione Annullata</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; 
            background: #f5f5f5; 
            margin: 0;
            padding: 0;
          }
          .container { 
            max-width: 600px; 
            margin: 50px auto; 
            background: white; 
            padding: 40px; 
            border-radius: 8px; 
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          h1 { 
            color: #1C1C1C; 
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          .success { 
            color: #666666; 
            font-size: 16px;
            line-height: 24px;
            margin: 20px 0;
          }
          .link {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background: #C4956A;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
          }
          .link:hover {
            background: #b8845f;
          }
          .footer {
            color: #999;
            font-size: 12px;
            margin-top: 30px;
            border-top: 1px solid #E8E8E8;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✓ Iscrizione Annullata</h1>
          <p class="success">
            Hai annullato con successo la tua iscrizione alla newsletter di FriFri.
          </p>
          <p class="success">
            Non riceverai più email da noi. Potrai iscriverti di nuovo in qualsiasi momento dalla nostra home page.
          </p>
          <a href="https://frifri.it" class="link">Torna alla home</a>
          <div class="footer">
            <p>Se pensi che questo sia un errore, puoi iscriverti di nuovo dalla nostra home page.</p>
          </div>
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

router.delete('/:id', authMiddleware, requireRole(['admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await newsletterService.deleteSubscriber(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await newsletterService.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
