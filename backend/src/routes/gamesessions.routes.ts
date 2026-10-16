import { Router, Request, Response, NextFunction } from 'express';
import { gameSessionService } from '../services/gamesession.service.js';
import { prizeCodeService } from '../services/prizecode.service.js';
import { gameConfigService } from '../services/gameconfig.service.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { gameSessionLimiter, reserveIpLimiter } from '../middleware/rateLimit.middleware.js';
import { GameSessionFilterSchema } from '../schemas/gamesession.schema.js';

const router = Router();

// Public: attempts/cooldown status
router.get('/attempts-status', gameSessionLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, gameType, browserFingerprint } = req.query;
    if (!email || !gameType || !browserFingerprint) {
      res.status(400).json({ error: 'Missing required query params: email, gameType, and browserFingerprint' });
      return;
    }

    const status = await gameConfigService.checkAttemptsStatus(
      String(email).toLowerCase(),
      String(gameType),
      String(browserFingerprint)
    );
    res.json(status);
  } catch (error) {
    next(error);
  }
});

// Public: Start a game session with backend-managed cooldown and random sponsor selection
router.post('/start', gameSessionLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, gameType, preferredSponsorId, browserFingerprint } = req.body;

    if (!email || !gameType) {
      res.status(400).json({ 
        error: 'Missing required fields: email and gameType' 
      });
      return;
    }

    const result = await gameSessionService.startGameSession(email, gameType, preferredSponsorId, browserFingerprint);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Public: Reserve a game session (create with temp email, before user enters real email)
// Layer 1 protection: IP-based limiter (max 1 reserve per 60s)
router.post('/reserve', reserveIpLimiter, gameSessionLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gameType, sponsorId } = req.body;

    if (!gameType || !sponsorId) {
      res.status(400).json({ 
        error: 'Missing required fields: gameType and sponsorId' 
      });
      return;
    }

    const result = await gameSessionService.reserveGameSession(gameType, sponsorId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Public: Confirm email on reserved session
router.post('/:id/confirm-email', gameSessionLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, browserFingerprint } = req.body;

    if (!email || !browserFingerprint) {
      res.status(400).json({ 
        error: 'Missing required fields: email and browserFingerprint' 
      });
      return;
    }

    const result = await gameSessionService.confirmEmail(id, email, browserFingerprint);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Public: Confirm email (PUT compatibility)
router.put('/:id/confirm-email', gameSessionLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, browserFingerprint } = req.body;

    if (!id || !email || !browserFingerprint) {
      res.status(400).json({ 
        error: 'Missing required fields: id, email and browserFingerprint' 
      });
      return;
    }

    const result = await gameSessionService.confirmEmail(id, email, browserFingerprint);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Admin: list sessions
router.get('/', authMiddleware, requireRole(['admin']), validateRequest(GameSessionFilterSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await gameSessionService.getGameSessions(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Admin: stats
router.get('/stats', authMiddleware, requireRole(['admin']), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await gameSessionService.getGameStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Public endpoint to verify prize claims (for QR scanning)
router.get('/verify/claim', gameSessionLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { prizeCode } = req.query;
    
    if (!prizeCode || typeof prizeCode !== 'string') {
      res.status(400).json({ error: 'prizeCode is required' });
      return;
    }

    const session = await gameSessionService.getGameSessionByPrizeCode(prizeCode);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

// Get a specific game session by ID (public - hides winningAnswer except for fortuna_montelupo)
router.get('/:id', gameSessionLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    const session = await gameSessionService.getGameSessionById(id);
    
    // SECURITY: Hide sensitive data for pending sessions
    if (session.result === 'pending' && session.gameType !== 'fortuna_montelupo') {
      // Remove both winningAnswer and quizData (contains correctAnswerIndex)
      const { winningAnswer, quizData, ...safeSession } = session;
      res.json(safeSession);
    } else {
      // For completed games, also remove quizData to prevent cheating tools
      const { quizData, ...publicSession } = session;
      res.json(publicSession);
    }
  } catch (error) {
    next(error);
  }
});

// Admin: Update game session result (win/lose)
router.post('/:id', authMiddleware, requireRole(['admin']), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { result } = req.body;

    if (!id || !result || !['win', 'lose'].includes(result)) {
      res.status(400).json({
        error: 'Invalid request: id and result (win/lose) are required'
      });
      return;
    }

    const session = await gameSessionService.updateGameSessionResult(id, result);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

// Admin: Claim prize (not used by frontend)
router.post('/:id/claim-prize', authMiddleware, requireRole(['admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prizeCode } = req.body;
    const session = await gameSessionService.claimPrize(req.params.id, prizeCode);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

// Process FortunaItaliana game (slot game with legacy isWin logic)
router.post('/:id/fortune-italiana', gameSessionLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    const result = await gameSessionService.procesFortunaItaliana(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Process FortunaMontelupo game (2-slot roulette with poem parts)
router.post('/:id/fortune-montelupo', gameSessionLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    const result = await gameSessionService.processFortunaMontelupo(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/guess', gameSessionLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { vaseChoice } = req.body;

    if (vaseChoice === undefined || vaseChoice === null) {
      res.status(400).json({ error: 'vaseChoice is required' });
      return;
    }

    const result = await gameSessionService.processGuess(req.params.id, vaseChoice);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Process a single answer in a quiz (sends feedback without revealing correct answer)
router.post('/:id/answer', gameSessionLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { questionIdx, selectedAnswer } = req.body;

    if (questionIdx === undefined || selectedAnswer === undefined) {
      res.status(400).json({ error: 'questionIdx and selectedAnswer are required' });
      return;
    }

    const result = await gameSessionService.processAnswer(req.params.id, questionIdx, selectedAnswer);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Finalize a quiz session (calculate score and determine win/lose)
router.post('/:id/finalize', gameSessionLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { totalScore, totalQuestions } = req.body;

    if (totalScore === undefined || totalQuestions === undefined) {
      res.status(400).json({ error: 'totalScore and totalQuestions are required' });
      return;
    }

    const result = await gameSessionService.finalizeQuiz(req.params.id, totalScore, totalQuestions);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Public endpoint to generate a secure prize code for a winning game session
router.post('/:id/generate-prize', gameSessionLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;

    // SECURITY: Verify that sessionId in body matches the URL parameter
    if (!sessionId || sessionId !== id) {
      res.status(400).json({ error: 'sessionId mismatch - sessionId must match URL parameter' });
      return;
    }

    // Generate secure prize code (automatically linked to sponsor from gameSession)
    const prizeCode = await prizeCodeService.generatePrizeCodeForSession(sessionId);

    // Update gameSession with the generated prizeCode
    const updatedSession = await gameSessionService.claimPrize(sessionId, prizeCode.code);

    res.status(201).json({
      success: true,
      prizeCode: prizeCode.code,
      prizeDescription: prizeCode.prizeDescription,
      sponsorName: prizeCode.sponsor?.name,
      sponsorLogo: prizeCode.sponsor?.logoUrl,
      gameSession: updatedSession
    });
  } catch (error) {
    next(error);
  }
});

// Load quiz questions for GiocoPoesie with timeout config
router.post('/:id/load-quiz', gameSessionLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    const quiz = await gameSessionService.loadQuizForSession(id);
    res.json(quiz);
  } catch (error) {
    next(error);
  }
});

// Submit quiz answer - BACKEND validates timeout and determines win/loss
router.post('/:id/answer-quiz', gameSessionLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { selectedAnswerIndex, isTimeout } = req.body;

    if (!id) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    const result = await gameSessionService.answerQuizQuestion(id, selectedAnswerIndex, isTimeout);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
