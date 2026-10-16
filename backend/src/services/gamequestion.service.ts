import prisma from '../db/client.js';
import { NotFoundError, ValidationError, InternalServerError } from '../utils/errors.js';

export class GameQuestionService {
  /**
   * Get all questions for a specific game type
   * Returns empty array for fortuna_montelupo (vase game has no questions)
   */
  async getQuestionsByGameType(gameType: string) {
    try {
      if (!gameType) {
        throw new ValidationError('gameType is required');
      }

      // fortuna_montelupo is a vase game with no questions
      if (gameType === 'fortuna_montelupo') {
        return [];
      }

      const questions = await prisma.gameQuestion.findMany({
        where: { gameType },
        orderBy: { questionNumber: 'asc' }
      });

      if (!questions || questions.length === 0) {
        throw new NotFoundError('Questions', gameType);
      }

      return questions;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to fetch questions');
    }
  }

  /**
   * Get a specific question by gameType and questionNumber
   */
  async getQuestion(gameType: string, questionNumber: number) {
    try {
      if (!gameType || questionNumber === undefined) {
        throw new ValidationError('gameType and questionNumber are required');
      }

      const question = await prisma.gameQuestion.findUnique({
        where: {
          gameType_questionNumber: {
            gameType,
            questionNumber
          }
        }
      });

      if (!question) {
        throw new NotFoundError('Question', `${gameType}-${questionNumber}`);
      }

      return question;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to fetch question');
    }
  }

  /**
   * Get correct answer for a question
   * Used internally by processAnswer
   */
  async getCorrectAnswer(gameType: string, questionNumber: number): Promise<number | null> {
    try {
      const question = await this.getQuestion(gameType, questionNumber);
      return question.correctAnswerIndex;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create a new question
   */
  async createQuestion(data: {
    gameType: string;
    questionNumber: number;
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
  }) {
    try {
      const { gameType, questionNumber, questionText, options, correctAnswerIndex } = data;

      if (!gameType || questionNumber === undefined || !questionText || !Array.isArray(options) || correctAnswerIndex === undefined) {
        throw new ValidationError('All fields are required');
      }

      if (options.length < 2) {
        throw new ValidationError('At least 2 options are required');
      }

      if (correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
        throw new ValidationError('correctAnswerIndex must be a valid option index');
      }

      // Check if question already exists
      const existing = await prisma.gameQuestion.findUnique({
        where: {
          gameType_questionNumber: {
            gameType,
            questionNumber
          }
        }
      });

      if (existing) {
        throw new ValidationError(`Question already exists for ${gameType} at position ${questionNumber}`);
      }

      const question = await prisma.gameQuestion.create({
        data: {
          gameType,
          questionNumber,
          questionText,
          options: options,
          correctAnswerIndex
        }
      });

      return question;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new InternalServerError('Failed to create question');
    }
  }

  /**
   * Update a question
   */
  async updateQuestion(
    gameType: string,
    questionNumber: number,
    data: {
      questionText?: string;
      options?: string[];
      correctAnswerIndex?: number;
    }
  ) {
    try {
      if (!gameType || questionNumber === undefined) {
        throw new ValidationError('gameType and questionNumber are required');
      }

      const { questionText, options, correctAnswerIndex } = data;

      // Validate update data
      if (options && !Array.isArray(options)) {
        throw new ValidationError('options must be an array');
      }

      if (options && options.length < 2) {
        throw new ValidationError('At least 2 options are required');
      }

      if (correctAnswerIndex !== undefined && options) {
        if (correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
          throw new ValidationError('correctAnswerIndex must be a valid option index');
        }
      }

      const question = await prisma.gameQuestion.update({
        where: {
          gameType_questionNumber: {
            gameType,
            questionNumber
          }
        },
        data: {
          ...(questionText && { questionText }),
          ...(options && { options }),
          ...(correctAnswerIndex !== undefined && { correctAnswerIndex })
        }
      });

      return question;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundError('Question', `${gameType}-${questionNumber}`);
      }
      throw new InternalServerError('Failed to update question');
    }
  }

  /**
   * Delete a question
   */
  async deleteQuestion(gameType: string, questionNumber: number) {
    try {
      if (!gameType || questionNumber === undefined) {
        throw new ValidationError('gameType and questionNumber are required');
      }

      await prisma.gameQuestion.delete({
        where: {
          gameType_questionNumber: {
            gameType,
            questionNumber
          }
        }
      });

      return { success: true };
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundError('Question', `${gameType}-${questionNumber}`);
      }
      throw new InternalServerError('Failed to delete question');
    }
  }
}
