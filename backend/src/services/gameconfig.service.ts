import prisma from '../db/client.js';
import { logger } from '../logger.js';

export interface GameConfigData {
  id?: string;
  gameType: string;
  attemptsPerDay: number;
  cooldownMinutes: number;
  dailyResetHour: number;
  description?: string;
  active: boolean;
  
  // Win rate config per fortune games
  winEveryXAttempts?: number;
  
  // Quiz config for gioco_poesie
  questionsPerGame?: number;
  questionsToWin?: number;
  difficulty?: string;
  questionsTimeoutSeconds?: number;
}

interface AttemptsStatus {
  attemptsRemaining: number;
  totalAttempts: number;
  cooldownUntilMs?: number;
}

const DEFAULT_CONFIGS: Record<string, GameConfigData> = {
  fortuna_italiana: {
    gameType: "fortuna_italiana",
    attemptsPerDay: 5,
    cooldownMinutes: 5,
    dailyResetHour: 0,
    description: "Fortuna Italiana - Slot con Poesie",
    active: true,
    winEveryXAttempts: 3, // 1 vincita ogni ~3 partite
  },
  fortuna_montelupo: {
    gameType: "fortuna_montelupo",
    attemptsPerDay: 5,
    cooldownMinutes: 5,
    dailyResetHour: 0,
    description: "Fortuna Montelupo - Vasetti",
    active: true,
    winEveryXAttempts: 3,
  },
  gioco_poesie: {
    gameType: "gioco_poesie",
    attemptsPerDay: 5,
    cooldownMinutes: 5,
    dailyResetHour: 0,
    description: "Gioco Poesie - Quiz",
    active: true,
    questionsPerGame: 1,
    questionsToWin: 1,
    difficulty: "facile",
    questionsTimeoutSeconds: 30,
  },
};

export class GameConfigService {
  async getGameConfig(gameType: string): Promise<GameConfigData> {
    try {
      // Try to fetch from database
      let config = await (prisma as any).gameConfig.findUnique({
        where: { gameType },
      });

      // If not found, use default
      if (!config) {
        const defaultConfig = DEFAULT_CONFIGS[gameType] || DEFAULT_CONFIGS.fortuna_italiana;
        logger.info(`Using default config for gameType: ${gameType}`);
        return defaultConfig;
      }

      return {
        gameType: config.gameType,
        attemptsPerDay: config.attemptsPerDay,
        cooldownMinutes: config.cooldownMinutes,
        dailyResetHour: config.dailyResetHour,
        description: config.description || undefined,
        active: config.active,
        winEveryXAttempts: config.winEveryXAttempts,
        questionsPerGame: config.questionsPerGame,
        questionsToWin: config.questionsToWin,
        difficulty: config.difficulty,
        questionsTimeoutSeconds: config.questionsTimeoutSeconds,
      };
    } catch (error) {
      logger.error(`Error fetching game config for ${gameType}:`, error);
      // Return default on error
      const defaultConfig = DEFAULT_CONFIGS[gameType] || DEFAULT_CONFIGS.fortuna_italiana;
      return defaultConfig;
    }
  }

  /**
   * Check player's attempts status for a game
   * Returns remaining attempts and cooldown info
   */
  async checkAttemptsStatus(
    email: string,
    gameType: string,
    browserFingerprint: string = ''
  ): Promise<AttemptsStatus> {
    try {
      const config = await this.getGameConfig(gameType);

      if (!config.active) {
        return {
          attemptsRemaining: 0,
          totalAttempts: config.attemptsPerDay,
        };
      }

      // Calculate UTC time for daily reset
      const now = new Date();
      const resetHour = config.dailyResetHour;

      // Determine today's reset time (UTC)
      let resetTime = new Date();
      resetTime.setUTCHours(resetHour, 0, 0, 0);

      // If reset hour hasn't occurred yet today, use yesterday's reset
      if (resetTime > now) {
        resetTime.setUTCDate(resetTime.getUTCDate() - 1);
      }

      // Count attempts today - Layer 3: Check BOTH email AND fingerprint (OR condition)
      // This prevents device-hopping: same device = same cooldown, regardless of email
      // And prevents email spam: same email = same cooldown, regardless of device
      const attemptsToday = await prisma.gameSession.count({
        where: {
          gameType: gameType,
          result: { in: ['win', 'lose'] }, // Count only completed games
          playedDate: {
            gte: resetTime,
            lt: new Date(resetTime.getTime() + 24 * 60 * 60 * 1000),
          },
          OR: [
            { playerEmail: email },
            { browserFingerprint } // Match if email OR fingerprint match
          ]
        },
      });

      const attemptsRemaining = Math.max(0, config.attemptsPerDay - attemptsToday);

      // Check cooldown from last attempt - Layer 3: Check BOTH email AND fingerprint
      const lastAttempt = await prisma.gameSession.findFirst({
        where: {
          gameType: gameType,
          result: { in: ['win', 'lose'] }, // Cooldown starts after a completed game
          OR: [
            { playerEmail: email },
            { browserFingerprint }
          ]
        },
        orderBy: {
          playedDate: "desc",
        },
      });

      let cooldownUntilMs: number | undefined;

      if (lastAttempt && config.cooldownMinutes > 0) {
        const cooldownEnd = new Date(
          lastAttempt.playedDate.getTime() + config.cooldownMinutes * 60 * 1000
        );

        if (cooldownEnd > now) {
          cooldownUntilMs = cooldownEnd.getTime();
        }
      }

      return {
        attemptsRemaining,
        totalAttempts: config.attemptsPerDay,
        cooldownUntilMs,
      };
    } catch (error) {
      logger.error(`Error checking attempts status for ${email}:`, error);
      // On error, allow attempt (fail open)
      return {
        attemptsRemaining: 1,
        totalAttempts: 1,
      };
    }
  }

  /**
   * Validate if player can play this game (has attempts and not on cooldown)
   * Layer 3: Checks BOTH email and browserFingerprint for cooldown evasion prevention
   */
  async canPlayerPlay(email: string, gameType: string, browserFingerprint: string = ''): Promise<boolean> {
    const status = await this.checkAttemptsStatus(email, gameType, browserFingerprint);
    return status.attemptsRemaining > 0 && !status.cooldownUntilMs;
  }

  /**
   * Create or update game configuration
   */
  async upsertGameConfig(data: GameConfigData): Promise<GameConfigData> {
    try {
      const config = await (prisma as any).gameConfig.upsert({
        where: { gameType: data.gameType },
        create: data,
        update: {
          attemptsPerDay: data.attemptsPerDay,
          cooldownMinutes: data.cooldownMinutes,
          dailyResetHour: data.dailyResetHour,
          description: data.description,
          active: data.active,
          winEveryXAttempts: data.winEveryXAttempts,
          questionsPerGame: data.questionsPerGame,
          questionsToWin: data.questionsToWin,
          difficulty: data.difficulty,
          questionsTimeoutSeconds: data.questionsTimeoutSeconds,
          updatedAt: new Date(),
        },
      });

      logger.info(`Updated game config for ${data.gameType}`);

      return {
        gameType: config.gameType,
        attemptsPerDay: config.attemptsPerDay,
        cooldownMinutes: config.cooldownMinutes,
        dailyResetHour: config.dailyResetHour,
        description: config.description || undefined,
        active: config.active,
        winEveryXAttempts: config.winEveryXAttempts,
        questionsPerGame: config.questionsPerGame,
        questionsToWin: config.questionsToWin,
        difficulty: config.difficulty,
        questionsTimeoutSeconds: config.questionsTimeoutSeconds,
      };
    } catch (error) {
      logger.error(`Error upserting game config:`, error);
      throw error;
    }
  }

  /**
   * Initialize default configurations if they don't exist
   */
  async initializeDefaults(): Promise<void> {
    try {
      for (const [, config] of Object.entries(DEFAULT_CONFIGS)) {
        await this.upsertGameConfig(config);
      }
      logger.info("Initialized default game configurations");
    } catch (error) {
      logger.error("Error initializing default game configs:", error);
    }
  }

  /**
   * Get all game configurations
   */
  async getAllConfigs(): Promise<GameConfigData[]> {
    try {
      const configs = await (prisma as any).gameConfig.findMany({
        orderBy: { gameType: "asc" },
      });

      return configs;
    } catch (error) {
      logger.error("Error fetching all game configs:", error);
      throw error;
    }
  }

  /**
   * Create a new game config
   */
  async createGameConfig(data: GameConfigData): Promise<GameConfigData> {
    try {
      const config = await (prisma as any).gameConfig.create({
        data: {
          gameType: data.gameType,
          attemptsPerDay: data.attemptsPerDay || 5,
          cooldownMinutes: data.cooldownMinutes || 5,
          dailyResetHour: data.dailyResetHour || 0,
          active: data.active !== undefined ? data.active : true,
          description: data.description,
          winEveryXAttempts: data.winEveryXAttempts,
          questionsPerGame: data.questionsPerGame,
          questionsToWin: data.questionsToWin,
          difficulty: data.difficulty,
        },
      });

      return config;
    } catch (error) {
      logger.error("Error creating game config:", error);
      throw error;
    }
  }

  /**
   * Update an existing game config
   */
  async updateGameConfig(id: string, data: Partial<GameConfigData>): Promise<GameConfigData> {
    try {
      const config = await (prisma as any).gameConfig.update({
        where: { id },
        data: {
          attemptsPerDay: data.attemptsPerDay,
          cooldownMinutes: data.cooldownMinutes,
          dailyResetHour: data.dailyResetHour,
          active: data.active,
          description: data.description,
          winEveryXAttempts: data.winEveryXAttempts,
          questionsPerGame: data.questionsPerGame,
          questionsToWin: data.questionsToWin,
          difficulty: data.difficulty,
        },
      });

      return config;
    } catch (error) {
      logger.error("Error updating game config:", error);
      throw error;
    }
  }

  /**
   * Get all game configurations
   */
  async getAllGameConfigs(): Promise<GameConfigData[]> {
    try {
      const configs = await (prisma as any).gameConfig.findMany({
        orderBy: { gameType: "asc" },
      });

      return configs.map((config: any) => ({
        gameType: config.gameType,
        attemptsPerDay: config.attemptsPerDay,
        cooldownMinutes: config.cooldownMinutes,
        dailyResetHour: config.dailyResetHour,
        description: config.description || undefined,
        active: config.active,
      }));
    } catch (error) {
      logger.error("Error fetching all game configs:", error);
      return Object.values(DEFAULT_CONFIGS);
    }
  }
}

export const gameConfigService = new GameConfigService();
