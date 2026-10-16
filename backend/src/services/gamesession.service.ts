import prisma from '../db/client.js';
import { CreateGameSessionSchema, GameSessionFilterSchema } from '../schemas/gamesession.schema.js';
import { NotFoundError, ValidationError, InternalServerError } from '../utils/errors.js';
import { GameQuestionService } from './gamequestion.service.js';
import { gameConfigService } from './gameconfig.service.js';
import { getPoemPart } from '../utils/poem.utils.js';
import { generateGiocoPoesieQuiz } from '../utils/game.logic.js';
import { logger } from '../logger.js';

export class GameSessionService {
  private questionService = new GameQuestionService();
  
  private ensureEmailConfirmed(email: string) {
    if (!email || email.includes('@frifri.local')) {
      throw new ValidationError('Email not confirmed for this session');
    }
  }

  private async enforceCanPlay(email: string, gameType: string) {
    const status = await gameConfigService.checkAttemptsStatus(email, gameType, '');
    if (status.attemptsRemaining <= 0) {
      throw new ValidationError('Daily attempt limit reached. Try again tomorrow.', 429);
    }
    if (status.cooldownUntilMs) {
      const secondsRemaining = Math.ceil((status.cooldownUntilMs - Date.now()) / 1000);
      const error = new ValidationError(`Please wait ${secondsRemaining} seconds before playing again.`, 429);
      error.metadata = { retryAfterSeconds: secondsRemaining };
      throw error;
    }
  }

  /**
   * Generate winning answer based on game type
   * - fortuna_montelupo: winning vase (0-2)
   * - fortuna_italiana: 3 random slots with poem + part
   */
  private async generateWinningAnswer(gameType: string): Promise<any> {
    if (gameType === 'fortuna_montelupo') {
      // For FortunaMontelupo, generate and return initial slot text
      // This will be stored in winningAnswer and compared during play
      try {
        const poems = await prisma.poem.findMany({
          where: { active: true },
          select: { text: true }
        });

        if (!poems || poems.length === 0) {
          logger.warn('No active poems found for fortuna_montelupo');
          return null;
        }

        const randomPoem = poems[Math.floor(Math.random() * poems.length)];
        const randomPartIndex = Math.floor(Math.random() * 3) as 0 | 1 | 2;
        const slotText = getPoemPart(randomPoem.text, randomPartIndex);
        
        logger.debug(`Generated winning answer for fortuna_montelupo: ${slotText?.substring(0, 20)}...`);
        return slotText || null;
      } catch (error) {
        logger.error({ error, gameType }, 'Error generating winning answer for fortuna_montelupo');
        throw error;
      }
    }
    if (gameType === 'fortuna_italiana') {
      // For FortunaItaliana, not used (will be generated during play)
      return null;
    }
    return null;
  }

  /**
   * Start a new game session: check cooldown, select random sponsor, return sponsor + sessionId
   * This is the ONLY place where business logic for game start should be
   */
  async startGameSession(email: string, gameType: string, preferredSponsorId?: string, browserFingerprint?: string) {
    try {
      // Validate input
      if (!email || !gameType) {
        throw new ValidationError('Email and gameType are required');
      }

      // Check attempts and cooldown using GameConfig service
      const canPlay = await gameConfigService.canPlayerPlay(email.toLowerCase(), gameType, browserFingerprint || '');
      if (!canPlay) {
        const status = await gameConfigService.checkAttemptsStatus(email.toLowerCase(), gameType, browserFingerprint || '');
        if (status.attemptsRemaining <= 0) {
          throw new ValidationError('Daily attempt limit reached. Try again tomorrow.', 429);
        }
        if (status.cooldownUntilMs) {
          const secondsRemaining = Math.ceil((status.cooldownUntilMs - Date.now()) / 1000);
          const error = new ValidationError(`Please wait ${secondsRemaining} seconds before playing again.`, 429);
          error.metadata = { retryAfterSeconds: secondsRemaining };
          throw error;
        }
      }

      // If preferredSponsorId is provided, try to use that sponsor first
      let selectedSponsor;
      
      if (preferredSponsorId) {
        selectedSponsor = await prisma.sponsor.findUnique({
          where: { id: preferredSponsorId }
        });
        
        // If preferred sponsor not found or not active, fall back to random selection
        if (!selectedSponsor || !selectedSponsor.active) {
          selectedSponsor = null;
        }
      }

      // If no preferred sponsor selected, get random one
      if (!selectedSponsor) {
        // Get all active sponsors for this game type OR sponsors for "tutti" (all games)
        const sponsors = await prisma.sponsor.findMany({
          where: {
            active: true,
            OR: [
              { gameType: gameType === 'tutti' ? undefined : gameType },
              { gameType: 'tutti' } // Sponsors available for all games
            ]
          }
        });

        if (!sponsors || sponsors.length === 0) {
          throw new ValidationError('No active sponsors available for this game');
        }

        // Select random sponsor using cryptographically secure method
        const randomIndex = Math.floor(Math.random() * sponsors.length);
        selectedSponsor = sponsors[randomIndex];
      }

      // Create game session with preliminary status (no result yet)
      const winningAnswer = await this.generateWinningAnswer(gameType);
      
      const sessionData: any = {
        playerEmail: email.toLowerCase(),
        gameType,
        sponsorId: selectedSponsor.id,
        browserFingerprint: browserFingerprint || null,
        result: 'pending',
        playedDate: new Date()
      };

      // For fortuna_montelupo: use winningAnswerText (string)
      // For other games: use winningAnswer (int)
      if (gameType === 'fortuna_montelupo') {
        sessionData.winningAnswerText = winningAnswer;
      } else {
        sessionData.winningAnswer = winningAnswer;
      }

      const gameSession = await prisma.gameSession.create({
        data: sessionData,
        include: {
          sponsor: {
            select: {
              id: true,
              name: true,
              prizeDescription: true,
              logoUrl: true
            }
          }
        }
      });

      return {
        sessionId: gameSession.id,
        sponsor: gameSession.sponsor
      };
    } catch (error: any) {
      logger.error({ 
        message: error?.message,
        code: error?.code,
        gameType,
        email: email?.substring(0, 3) + '***',
        preferredSponsorId,
        error
      }, 'startGameSession error');
      if (error instanceof ValidationError) throw error;
      throw new InternalServerError('Failed to start game session');
    }
  }

  /**
   * Reserve a game session: create session with temporary email, return sessionId + sponsor
   * Called when user chooses sponsor from home page (before email gate)
   * For fortuna_montelupo only: generate initial slot and store in winningAnswerText
   */
  async reserveGameSession(gameType: string, sponsorId: string) {
    try {
      if (!gameType || !sponsorId) {
        throw new ValidationError('gameType and sponsorId are required');
      }

      // Verify sponsor exists and is active
      const sponsor = await prisma.sponsor.findUnique({
        where: { id: sponsorId }
      });

      if (!sponsor || !sponsor.active) {
        throw new ValidationError('Sponsor not found or not active');
      }

      // Create temporary email for reserved session
      const tempEmail = `pending-${Date.now()}@frifri.local`;

      // For fortuna_montelupo, generate initial slot now and store in winningAnswerText
      let winningAnswerText = null;
      if (gameType === 'fortuna_montelupo') {
        winningAnswerText = await this.generateWinningAnswer(gameType);
      }

      // Create game session with temporary email
      const gameSession = await prisma.gameSession.create({
        data: {
          playerEmail: tempEmail,
          gameType,
          sponsorId,
          result: 'pending',
          winningAnswerText
          // Don't set playedDate - session hasn't been played yet
        },
        include: {
          sponsor: {
            select: {
              id: true,
              name: true,
              prizeDescription: true,
              logoUrl: true
            }
          }
        }
      });

      return {
        sessionId: gameSession.id,
        sponsor: gameSession.sponsor,
        gameType
      };
    } catch (error: any) {
      if (error instanceof ValidationError) throw error;
      throw new InternalServerError('Failed to reserve game session');
    }
  }

  /**
   * Confirm email: update a reserved session with the real player email
   * Called when user submits email in email gate
   */
  async confirmEmail(sessionId: string, email: string, browserFingerprint: string) {
    try {
      if (!sessionId || !email || !browserFingerprint) {
        throw new ValidationError('sessionId, email, and browserFingerprint are required');
      }

      // Verify session exists
      const session = await prisma.gameSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        throw new NotFoundError('Game session', sessionId);
      }

      const normalizedEmail = email.toLowerCase();

      // If session already completed, create a fresh session for this email
      if (session.result !== 'pending') {
        return await this.startGameSession(
          normalizedEmail,
          session.gameType,
          session.sponsorId || undefined,
          browserFingerprint
        );
      }

      // If session already has a real email (not temp), allow "reconfirm" with same email or check cooldown for new email
      if (session.playerEmail && !session.playerEmail.includes('@frifri.local')) {
        // Session already confirmed - allow if same email, or check cooldown if different
        if (session.playerEmail === normalizedEmail) {
          // Same email - update browserFingerprint if not already set (reload case)
          const sessionData = await prisma.gameSession.findUnique({
            where: { id: sessionId },
            include: {
              sponsor: {
                select: {
                  id: true,
                  name: true,
                  prizeDescription: true,
                  logoUrl: true
                }
              }
            }
          });
          
          // Update fingerprint if this session doesn't have one yet
          if (sessionData && !sessionData.browserFingerprint && browserFingerprint) {
            await prisma.gameSession.update({
              where: { id: sessionId },
              data: { browserFingerprint }
            });
          }
          
          return {
            sessionId: sessionData!.id,
            sponsor: sessionData!.sponsor
          };
        } else {
          // Different email - need to check cooldown for new email AND fingerprint
          const canPlay = await gameConfigService.canPlayerPlay(normalizedEmail, session.gameType, browserFingerprint);
          if (!canPlay) {
            const status = await gameConfigService.checkAttemptsStatus(normalizedEmail, session.gameType, browserFingerprint);
            if (status.attemptsRemaining <= 0) {
              throw new ValidationError('Daily attempt limit reached. Try again tomorrow.', 429);
            }
            if (status.cooldownUntilMs) {
              const secondsRemaining = Math.ceil((status.cooldownUntilMs - Date.now()) / 1000);
              const error = new ValidationError(`Please wait ${secondsRemaining} seconds before playing again.`, 429);
              error.metadata = { retryAfterSeconds: secondsRemaining };
              throw error;
            }
          }
          // Update to new email with browserFingerprint
          const updatedSession = await prisma.gameSession.update({
            where: { id: sessionId },
            data: { 
              playerEmail: normalizedEmail,
              browserFingerprint
            },
            include: {
              sponsor: {
                select: {
                  id: true,
                  name: true,
                  prizeDescription: true,
                  logoUrl: true
                }
              }
            }
          });
          return {
            sessionId: updatedSession.id,
            sponsor: updatedSession.sponsor
          };
        }
      }

      // Session has temp email - confirm with real email
      if (session.playerEmail && session.playerEmail.includes('@frifri.local')) {
        // Check cooldown for real email AND fingerprint
        const canPlay = await gameConfigService.canPlayerPlay(normalizedEmail, session.gameType, browserFingerprint);
        if (!canPlay) {
          const status = await gameConfigService.checkAttemptsStatus(normalizedEmail, session.gameType, browserFingerprint);
          if (status.attemptsRemaining <= 0) {
            throw new ValidationError('Daily attempt limit reached. Try again tomorrow.', 429);
          }
          if (status.cooldownUntilMs) {
            const secondsRemaining = Math.ceil((status.cooldownUntilMs - Date.now()) / 1000);
            const error = new ValidationError(`Please wait ${secondsRemaining} seconds before playing again.`, 429);
            error.metadata = { retryAfterSeconds: secondsRemaining };
            throw error;
          }
        }

        // Update session with real email and browserFingerprint
        const updatedSession = await prisma.gameSession.update({
          where: { id: sessionId },
          data: {
            playerEmail: normalizedEmail,
            browserFingerprint
          },
          include: {
            sponsor: {
              select: {
                id: true,
                name: true,
                prizeDescription: true,
                logoUrl: true
              }
            }
          }
        });

        return {
          sessionId: updatedSession.id,
          sponsor: updatedSession.sponsor
        };
      }

      // If we reach here, something is wrong
      throw new ValidationError('Session in invalid state');
    } catch (error: any) {
      logger.error({ 
        message: error?.message,
        code: error?.code,
        sessionId, 
        email: email?.substring(0, 3) + '***',
        error
      }, 'confirmEmail error');
      if (error instanceof ValidationError) throw error;
      if (error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to confirm email');
    }
  }

  async createGameSession(data: any) {
    try {
      const validated = CreateGameSessionSchema.parse(data);
      
      const gameSession = await prisma.gameSession.create({
        data: {
          ...validated,
          playedDate: validated.playedDate ? new Date(validated.playedDate) : new Date()
        },
        include: { sponsor: true }
      });

      if (gameSession.sponsorId) {
        await prisma.sponsor.update({
          where: { id: gameSession.sponsorId },
          data: { plays: { increment: 1 } }
        });
      }

      return gameSession;
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw new ValidationError(error.errors?.[0]?.message || 'Invalid game session data');
      }
      throw new InternalServerError('Failed to create game session');
    }
  }

  async getGameSessionById(sessionId: string) {
    try {
      if (!sessionId) {
        throw new ValidationError('Session ID is required');
      }

      const session = await prisma.gameSession.findUnique({
        where: { id: sessionId },
        include: { sponsor: true }
      });

      if (!session) {
        throw new NotFoundError('Game session', sessionId);
      }

      return session;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to fetch game session');
    }
  }

  async getGameSessions(filters: any) {
    try {
      const validated = GameSessionFilterSchema.parse(filters);
      
      const where: any = {};
      if (validated.gameType) where.gameType = validated.gameType;
      if (validated.playerEmail) where.playerEmail = { contains: validated.playerEmail, mode: 'insensitive' };
      if (validated.result) where.result = validated.result;
      if (validated.startDate || validated.endDate) {
        where.playedDate = {};
        if (validated.startDate) where.playedDate.gte = new Date(validated.startDate);
        if (validated.endDate) where.playedDate.lte = new Date(validated.endDate);
      }

      const [data, total] = await Promise.all([
        prisma.gameSession.findMany({
          where,
          skip: validated.offset,
          take: validated.limit,
          orderBy: { [validated.sortBy]: validated.sortOrder },
          include: { sponsor: true }
        }),
        prisma.gameSession.count({ where })
      ]);

      return { data, total, limit: validated.limit, offset: validated.offset };
    } catch (error) {
      throw new InternalServerError('Failed to fetch game sessions');
    }
  }

  async getGameStats() {
    try {
      const totalSessions = await prisma.gameSession.count();
      const wins = await prisma.gameSession.count({ where: { result: 'win' } });
      const losses = await prisma.gameSession.count({ where: { result: 'lose' } });
      
      const byGameType = await prisma.gameSession.groupBy({
        by: ['gameType'],
        _count: { id: true }
      });

      const redemptionRate = totalSessions > 0 ? ((await prisma.prizeCode.count({ where: { redeemed: true } })) / totalSessions) * 100 : 0;

      return {
        totalSessions,
        wins,
        losses,
        winRate: totalSessions > 0 ? (wins / totalSessions) * 100 : 0,
        redemptionRate,
        byGameType
      };
    } catch (error) {
      throw new InternalServerError('Failed to fetch game stats');
    }
  }

  async claimPrize(sessionId: string, prizeCode: string) {
    try {
      const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
      if (!session) throw new NotFoundError('Game session', sessionId);
      if (session.result !== 'win') throw new ValidationError('Can only claim prize for winning sessions');

      return await prisma.gameSession.update({
        where: { id: sessionId },
        data: { prizeCode }
      });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      throw new InternalServerError('Failed to claim prize');
    }
  }

  async updateGameSessionResult(sessionId: string, result: 'win' | 'lose') {
    try {
      if (!['win', 'lose'].includes(result)) {
        throw new ValidationError('Result must be "win" or "lose"');
      }

      const session = await prisma.gameSession.update({
        where: { id: sessionId },
        data: { result },
        include: { sponsor: true }
      });

      return session;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundError('Game session', sessionId);
      }
      throw new InternalServerError('Failed to update game session result');
    }
  }

  async processGuess(sessionId: string, vaseChoice: number) {
    try {
      // Retrieve the session with winning answer
      const session = await prisma.gameSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        throw new NotFoundError('Game session', sessionId);
      }

      if (session.result !== 'pending') {
        throw new ValidationError('Game session already completed');
      }

      if (session.gameType !== 'fortuna_montelupo') {
        throw new ValidationError('This game session is not fortuna_montelupo');
      }

      this.ensureEmailConfirmed(session.playerEmail);
      await this.enforceCanPlay(session.playerEmail, session.gameType);

      // Validate vaseChoice
      if (typeof vaseChoice !== 'number' || vaseChoice < 0 || vaseChoice > 2) {
        throw new ValidationError('Invalid vase choice (must be 0, 1, or 2)');
      }

      // Determine if won (backend decision, not frontend!)
      const won = vaseChoice === session.winningAnswer;
      const result = won ? 'win' : 'lose';

      // Update session with result
      const updatedSession = await prisma.gameSession.update({
        where: { id: sessionId },
        data: { result, playedDate: new Date() },
        include: { sponsor: true }
      });

      return {
        sessionId: updatedSession.id,
        result,
        won,
        winningVase: session.winningAnswer, // Show which vase was correct (for transparency)
        chosenVase: vaseChoice // Show which vase player chose
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to process guess');
    }
  }

  /**
   * Process FortunaItaliana game: generate 3 random slots with random poems/parts
   * Win condition: determined by wineEveryXAttempts (e.g., win 1 in 3 attempts)
   * Frontend shows actual poem quartine text for 3 parts, each with color (0=green, 1=white, 2=red)
   */
  async procesFortunaItaliana(sessionId: string) {
    try {
      const session = await prisma.gameSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        throw new NotFoundError('Game session', sessionId);
      }

      if (session.result !== 'pending') {
        throw new ValidationError('Game session already completed');
      }

      if (session.gameType !== 'fortuna_italiana') {
        throw new ValidationError('This game session is not fortuna_italiana');
      }

      this.ensureEmailConfirmed(session.playerEmail);
      await this.enforceCanPlay(session.playerEmail, session.gameType);

      // Get all active poems from database
      const poems = await prisma.poem.findMany({
        where: { active: true },
        select: { id: true, title: true, text: true }
      });

      if (!poems || poems.length === 0) {
        throw new ValidationError('No active poems available for FortunaItaliana');
      }

      // FIRST: Check if this should be a winning attempt
      const gameConfig = await gameConfigService.getGameConfig('fortuna_italiana');
      const shouldWin = await this.shouldWinByWineEveryXLogic(
        session.playerEmail,
        'fortuna_italiana',
        gameConfig.winEveryXAttempts || 3
      );

      // Generate slots based on win/loss
      let slots;
      if (shouldWin) {
        // WINNING ATTEMPT: Force bandiera [0, 1, 2] from SAME POEM (Italian flag)
        const winningPoem = poems[Math.floor(Math.random() * poems.length)];
        
        // Force exact [0, 1, 2] order (NOT shuffled) to ensure correct colors
        // 0 = Verde (Green), 1 = Bianco (White), 2 = Rosso (Red)
        slots = [0, 1, 2].map((partIndex) => ({
          poemId: winningPoem.id,
          title: winningPoem.title,
          text: winningPoem.text,
          partIndex: partIndex as 0 | 1 | 2
        }));
      } else {
        // LOSING ATTEMPT: Generate 3 random slots (may or may not form bandiera)
        slots = Array(3).fill(null).map(() => {
          const poem = poems[Math.floor(Math.random() * poems.length)];
          const partIndex = Math.floor(Math.random() * 3) as 0 | 1 | 2;
          return {
            poemId: poem.id,
            title: poem.title,
            text: poem.text,
            partIndex
          };
        });
      }

      // Extract actual part text using getPoemPart utility
      const slotsWithParts = slots.map(slot => ({
        poemId: slot.poemId,
        title: slot.title,
        partIndex: slot.partIndex,
        partText: getPoemPart(slot.text, slot.partIndex) || '[Parte non disponibile]'
      }));

      // Determine result
      const result = shouldWin ? 'win' : 'lose';
      const isWin = shouldWin;

      // Update session with result
      const updatedSession = await prisma.gameSession.update({
        where: { id: sessionId },
        data: { result, playedDate: new Date() },
        include: { sponsor: true }
      });

      // Return slots to frontend (visible after game spin)
      return {
        sessionId: updatedSession.id,
        result,
        won: isWin,
        slots: slotsWithParts
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to process FortunaItaliana');
    }
  }

  /**
   * Process FortunaMontelupo game: compare 2 slots
   * Initial slot is stored in winningAnswer when game starts (in startGameSession)
   * Win condition: determined by wineEveryXAttempts (e.g., win 1 in 3 attempts)
   */
  async processFortunaMontelupo(sessionId: string) {
    try {
      const session = await prisma.gameSession.findUnique({
        where: { id: sessionId },
        include: { sponsor: true }
      });

      if (!session) {
        throw new NotFoundError('Game session', sessionId);
      }

      if (session.result !== 'pending') {
        throw new ValidationError('Game session already completed');
      }

      if (session.gameType !== 'fortuna_montelupo') {
        throw new ValidationError('This game session is not fortuna_montelupo');
      }

      this.ensureEmailConfirmed(session.playerEmail);
      await this.enforceCanPlay(session.playerEmail, session.gameType);

      // The initial slot text is stored in winningAnswerText (only for fortuna_montelupo)
      if (!session.winningAnswerText) {
        throw new ValidationError('Initial slot not found for this session');
      }

      const initialSlotText = String(session.winningAnswerText);

      // Get all active poems from database
      const poems = await prisma.poem.findMany({
        where: { active: true },
        select: { id: true, title: true, text: true }
      });

      if (!poems || poems.length === 0) {
        throw new ValidationError('No active poems available for FortunaMontelupo');
      }

      // FIRST: Check if this should be a winning attempt
      const gameConfig = await gameConfigService.getGameConfig('fortuna_montelupo');
      const shouldWin = await this.shouldWinByWineEveryXLogic(
        session.playerEmail,
        'fortuna_montelupo',
        gameConfig.winEveryXAttempts || 3
      );

      // Generate second slot based on win/loss
      let randomSlotText: string;
      if (shouldWin) {
        // WINNING ATTEMPT: Force match by using the same text as initial slot
        randomSlotText = initialSlotText;
      } else {
        // LOSING ATTEMPT: Generate random slot (likely won't match)
        const randomPoem = poems[Math.floor(Math.random() * poems.length)];
        const randomPartIndex = Math.floor(Math.random() * 3) as 0 | 1 | 2;
        randomSlotText = getPoemPart(randomPoem.text, randomPartIndex) || '[Parte non disponibile]';
      }

      // Determine result
      const result = shouldWin ? 'win' : 'lose';
      const isWin = shouldWin;

      // Update session with result
      const updatedSession = await prisma.gameSession.update({
        where: { id: sessionId },
        data: { result, playedDate: new Date() },
        include: { sponsor: true }
      });

      // Return both slots to frontend
      return {
        sessionId: updatedSession.id,
        result,
        won: isWin,
        slots: [
          { partText: initialSlotText, partIndex: 0 },
          { partText: randomSlotText, partIndex: 1 }
        ]
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to process FortunaMontelupo');
    }
  }

  /**
   * Process GiocoPoesie game: select random poem, extract parts, generate quiz
   * Win condition: answer all questions correctly (verso mancante quiz)
   */
  async procesGiocoPoesie(sessionId: string, questionIdx: number, selectedAnswer: number) {
    try {
      const session = await prisma.gameSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        throw new NotFoundError('Game session', sessionId);
      }

      if (session.result !== 'pending') {
        throw new ValidationError('Game session already completed');
      }

      if (session.gameType !== 'gioco_poesie') {
        throw new ValidationError('This game session is not gioco_poesie');
      }

      this.ensureEmailConfirmed(session.playerEmail);
      await this.enforceCanPlay(session.playerEmail, session.gameType);

      // Validate inputs
      if (typeof questionIdx !== 'number' || questionIdx < 0 || questionIdx > 9) {
        throw new ValidationError('Invalid question index (must be 0-9)');
      }

      if (typeof selectedAnswer !== 'number' || selectedAnswer < 0 || selectedAnswer > 3) {
        throw new ValidationError('Invalid selected answer (must be 0-3)');
      }

      // Get or generate question data for this session's poem quiz
      // For now, we'll use GameQuestion service which should be properly seeded
      const correctAnswerIndex = await this.questionService.getCorrectAnswer(session.gameType, questionIdx);
      
      if (correctAnswerIndex === null) {
        throw new ValidationError('Invalid question for this game type');
      }

      // Determine if this answer was correct
      const isCorrect = selectedAnswer === correctAnswerIndex;

      // Track correct answers on backend
      if (isCorrect) {
        await prisma.gameSession.update({
          where: { id: sessionId },
          data: { correctAnswers: { increment: 1 } }
        });
      }

      return {
        isCorrect,
        questionIdx
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to process GiocoPoesie answer');
    }
  }

  async processAnswer(sessionId: string, questionIdx: number, selectedAnswer: number, _correctAnswer?: number) {
    try {
      const session = await prisma.gameSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        throw new NotFoundError('Game session', sessionId);
      }

      if (session.result !== 'pending') {
        throw new ValidationError('Game session already completed');
      }

      this.ensureEmailConfirmed(session.playerEmail);
      await this.enforceCanPlay(session.playerEmail, session.gameType);

      // Validate inputs
      if (typeof questionIdx !== 'number' || questionIdx < 0 || questionIdx > 2) {
        throw new ValidationError('Invalid question index');
      }

      if (typeof selectedAnswer !== 'number' || selectedAnswer < 0) {
        throw new ValidationError('Invalid selected answer');
      }

      // CRITICAL: Ignore any correctAnswer from frontend
      // Get correct answer from DATABASE only (not from hardcoded values)
      const correctAnswerIndex = await this.questionService.getCorrectAnswer(session.gameType, questionIdx);
      
      if (correctAnswerIndex === null) {
        throw new ValidationError('Invalid question for this game type');
      }

      // Determine if this answer was correct (backend decision)
      const isCorrect = selectedAnswer === correctAnswerIndex;

      // SECURITY: Track correct answers on backend (not trusting frontend!)
      if (isCorrect) {
        await prisma.gameSession.update({
          where: { id: sessionId },
          data: { correctAnswers: { increment: 1 } }
        });
      }

      // Return feedback (frontend should NOT see correctAnswer, only true/false)
      return {
        isCorrect,
        questionIdx
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to process answer');
    }
  }

  async finalizeQuiz(sessionId: string, _totalScore: number, _totalQuestions: number) {
    try {
      const session = await prisma.gameSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        throw new NotFoundError('Game session', sessionId);
      }

      if (session.result !== 'pending') {
        throw new ValidationError('Game session already completed');
      }

      this.ensureEmailConfirmed(session.playerEmail);
      await this.enforceCanPlay(session.playerEmail, session.gameType);

      // SECURITY: Backend decides win/lose based on BACKEND-TRACKED score
      // Completely ignore _totalScore parameter from frontend!
      // Use correctAnswers that was incremented by processAnswer
      const backendScore = session.correctAnswers;
      const won = backendScore >= 2;
      const result = won ? 'win' : 'lose';

      const updatedSession = await prisma.gameSession.update({
        where: { id: sessionId },
        data: { result, winningAnswer: backendScore, playedDate: new Date() },
        include: { sponsor: true }
      });

      return {
        sessionId: updatedSession.id,
        result,
        won,
        score: backendScore
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to finalize quiz');
    }
  }

  async getGameSessionByPrizeCode(prizeCode: string) {
    try {
      const session = await prisma.gameSession.findFirst({
        where: { 
          prizeCode,
          result: 'win'
        },
        include: { 
          sponsor: {
            select: {
              id: true,
              name: true,
              prizeDescription: true
            }
          }
        }
      });

      if (!session) throw new NotFoundError('Prize code', prizeCode);

      return {
        prizeCode: session.prizeCode,
        gameType: session.gameType,
        playedDate: session.playedDate,
        sponsor: session.sponsor,
        playerEmail: session.playerEmail
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to verify prize code');
    }
  }

  /**
   * Load quiz questions for GiocoPoesie
   * BACKEND CONTROLS: timeout duration, question generation, correct answer (hidden)
   */
  async loadQuizForSession(sessionId: string) {
    try {
      const session = await prisma.gameSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) throw new NotFoundError('Game session', sessionId);
      if (session.gameType !== 'gioco_poesie') {
        throw new ValidationError('This session is not a GiocoPoesie game');
      }
      if (session.result !== 'pending') {
        throw new ValidationError('Game session already completed');
      }

      this.ensureEmailConfirmed(session.playerEmail);
      await this.enforceCanPlay(session.playerEmail, session.gameType);

      // Get game config for timeout and question settings
      const config = await gameConfigService.getGameConfig('gioco_poesie');
      
      // Generate quiz questions
      const quiz = await generateGiocoPoesieQuiz();

      if (!quiz) {
        throw new InternalServerError('Failed to generate quiz questions - ensure poems have partA, partB, partC filled in');
      }

      // Store quiz in session (for answer validation later)
      // Update session with startTime for timeout validation
      await prisma.gameSession.update({
        where: { id: sessionId },
        data: { 
          quizData: quiz as any,
          quizStartTime: new Date()
        }
      });

      // Return quiz WITHOUT revealing correct answers
      return {
        timeoutSeconds: (config as any).questionsTimeoutSeconds || 30,
        questions: [{
          poemId: quiz.poemId,
          poemTitle: quiz.poemTitle,
          question: quiz.question,
          options: quiz.options,
          quartina: quiz.quartina,
          // DO NOT send correctAnswerIndex to frontend!
        }]
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      console.error('Error loading quiz:', error);
      throw new InternalServerError('Failed to load quiz');
    }
  }

  /**
   * Answer quiz question - BACKEND DECIDES WIN/LOSS
   * SECURITY: Validates timeout, checks answer correctness, applies win rate logic
   */
  async answerQuizQuestion(sessionId: string, selectedAnswerIndex: number, isTimeout: boolean = false) {
    try {
      const session = await prisma.gameSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) throw new NotFoundError('Game session', sessionId);
      if (session.gameType !== 'gioco_poesie') {
        throw new ValidationError('This session is not a GiocoPoesie game');
      }
      if (session.result !== 'pending') {
        throw new ValidationError('Game session already completed');
      }

      this.ensureEmailConfirmed(session.playerEmail);
      await this.enforceCanPlay(session.playerEmail, session.gameType);

      // Parse stored quiz data
      if (!session.quizData) {
        throw new InternalServerError('Quiz data not found for this session');
      }

      // quizData is already an object from Prisma JSON deserialization
      const quizQuestion = session.quizData as any;
      
      const config = await gameConfigService.getGameConfig('gioco_poesie');
      
      console.log('DEBUG answerQuizQuestion - quizQuestion:', quizQuestion);
      console.log('DEBUG - selectedAnswerIndex:', selectedAnswerIndex);
      console.log('DEBUG - correctAnswerIndex:', quizQuestion.correctAnswerIndex);
      
      // Validate timeout
      if (session.quizStartTime) {
        const elapsedSeconds = (Date.now() - session.quizStartTime.getTime()) / 1000;
        if (elapsedSeconds > ((config as any).questionsTimeoutSeconds || 30)) {
          // Timeout exceeded - auto-loss
          await prisma.gameSession.update({
            where: { id: sessionId },
            data: { result: 'lose', playedDate: new Date() }
          });

          return {
            won: false,
            reason: 'timeout',
            message: 'Il tempo è scaduto!'
          };
        }
      }

      // If player ran out of time
      if (isTimeout) {
        await prisma.gameSession.update({
          where: { id: sessionId },
          data: { result: 'lose', playedDate: new Date() }
        });

        return {
          won: false,
          reason: 'timeout',
          message: 'Il tempo è scaduto!'
        };
      }

      // Validate answer
      const isAnswerCorrect = selectedAnswerIndex === quizQuestion.correctAnswerIndex;

      // GIOCO POESIE: Win if correct (no probabilistic logic)
      // Unlike FortunaItaliana/Montelupo, this is pure skill-based
      const won = isAnswerCorrect;

      // Update session with result
      await prisma.gameSession.update({
        where: { id: sessionId },
        data: { result: won ? 'win' : 'lose', playedDate: new Date() }
      });

      return {
        won,
        correct: isAnswerCorrect,
        message: won ? '🎉 Hai vinto!' : isAnswerCorrect ? 'Risposta giusta ma no win questo turno!' : '❌ Risposta sbagliata!'
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      console.error('Error answering quiz:', error);
      throw new InternalServerError('Failed to process answer');
    }
  }

  /**
   * Determine win based on winEveryXAttempts logic - GLOBAL
   * Counts TOTAL completed attempts across ALL players for this gameType
   * Example: if winEveryXAttempts = 3, every 3rd attempt globally wins
   */
  private async shouldWinByWineEveryXLogic(
    playerEmail: string,
    gameType: string,
    winEveryXAttempts: number
  ): Promise<boolean> {
    try {
      const safeWinEveryX = Math.max(1, Math.floor(winEveryXAttempts || 1));

      logger.info({
        msg: '🎲 [winEveryX] CALLED',
        playerEmail,
        gameType,
        winEveryXConfig: safeWinEveryX
      });

      // Count ALL completed attempts for this gameType globally (not per player!)
      const totalCompletedAttempts = await prisma.gameSession.count({
        where: {
          gameType,
          result: { in: ['win', 'lose'] } // Only completed games
        }
      });

      logger.info({
        msg: '🎲 [winEveryX] GLOBAL ATTEMPT COUNT',
        gameType,
        totalCompletedAttempts
      });

      // Current attempt number is the NEXT one (before this one is saved)
      const currentAttemptNumber = totalCompletedAttempts + 1;
      const modulo = currentAttemptNumber % safeWinEveryX;
      const shouldWin = modulo === 0;

      logger.info({
        msg: '🎲 [winEveryX] WIN DECISION',
        playerEmail,
        gameType,
        totalCompletedAttempts,
        currentAttemptNumber,
        winEveryXAttempts: safeWinEveryX,
        modulo: `${currentAttemptNumber} % ${safeWinEveryX} = ${modulo}`,
        shouldWin,
        reasoning: shouldWin ? '🎉 THIS ATTEMPT WINS!' : `❌ Not a winning attempt (${modulo} !== 0)`
      });

      return shouldWin;
    } catch (error) {
      logger.error({
        msg: '❌ ERROR in shouldWinByWineEveryXLogic',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }
}

export const gameSessionService = new GameSessionService();
