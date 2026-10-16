import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { GameQuestionService } from '../services/gamequestion.service.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();
const questionService = new GameQuestionService();

/**
 * Middleware to handle public endpoints
 * Intercepts any route ending in /public to allow public access
 */
router.get('/:gameType/public', async (req, res, next) => {
  try {
    const { gameType } = req.params;
    
    if (!gameType) {
      throw new ValidationError('gameType is required');
    }

    const questions = await questionService.getQuestionsByGameType(gameType);
    
    // Strip out correctAnswerIndex from response to prevent frontend cheating
    const safeQuestions = questions.map(q => {
      const { correctAnswerIndex, ...safe } = q;
      return safe;
    });
    
    res.json(safeQuestions);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /game-questions/:gameType
 * Admin endpoint: get all questions for a specific game type
 * Frontend admin panel uses this to display and manage questions
 * INCLUDES correctAnswerIndex so admin can edit which answer is correct
 */
router.get('/:gameType', authMiddleware, requireRole(['admin']), async (req, res, next) => {
  try {
    const { gameType } = req.params;
    
    if (!gameType) {
      throw new ValidationError('gameType is required');
    }

    const questions = await questionService.getQuestionsByGameType(gameType);
    
    // Return full questions including correctAnswerIndex for admin editing
    res.json(questions);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /game-questions/:gameType/:questionNumber
 * Public endpoint: get a specific question (without correct answer)
 */
router.get('/:gameType/:questionNumber', async (req, res, next) => {
  try {
    const { gameType, questionNumber } = req.params;
    const qNum = parseInt(questionNumber, 10);

    if (!gameType || isNaN(qNum)) {
      throw new ValidationError('gameType and questionNumber are required');
    }

    const question = await questionService.getQuestion(gameType, qNum);
    
    // Strip out correctAnswerIndex
    const { correctAnswerIndex, ...safeQuestion } = question;
    
    res.json(safeQuestion);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /game-questions
 * Admin endpoint: create a new question
 */
router.post('/', authMiddleware, requireRole(['admin']), async (req, res, next) => {
  try {
    const { gameType, questionNumber, questionText, options, correctAnswerIndex } = req.body;

    if (!gameType || questionNumber === undefined || !questionText || !Array.isArray(options) || correctAnswerIndex === undefined) {
      throw new ValidationError('All fields are required: gameType, questionNumber, questionText, options (array), correctAnswerIndex');
    }

    if (correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
      throw new ValidationError('correctAnswerIndex must be a valid index in options array');
    }

    const question = await questionService.createQuestion({
      gameType,
      questionNumber,
      questionText,
      options,
      correctAnswerIndex
    });

    res.status(201).json(question);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /game-questions/:gameType/:questionNumber
 * Admin endpoint: update a question
 */
router.put('/:gameType/:questionNumber', authMiddleware, requireRole(['admin']), async (req, res, next) => {
  try {
    const { gameType, questionNumber } = req.params;
    const { questionText, options, correctAnswerIndex } = req.body;
    const qNum = parseInt(questionNumber, 10);

    if (!gameType || isNaN(qNum)) {
      throw new ValidationError('gameType and questionNumber are required');
    }

    const question = await questionService.updateQuestion(gameType, qNum, {
      questionText,
      options,
      correctAnswerIndex
    });

    res.json(question);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /game-questions/:gameType/:questionNumber
 * Admin endpoint: delete a question
 */
router.delete('/:gameType/:questionNumber', authMiddleware, requireRole(['admin']), async (req, res, next) => {
  try {
    const { gameType, questionNumber } = req.params;
    const qNum = parseInt(questionNumber, 10);

    if (!gameType || isNaN(qNum)) {
      throw new ValidationError('gameType and questionNumber are required');
    }

    await questionService.deleteQuestion(gameType, qNum);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
