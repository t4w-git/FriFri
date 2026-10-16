import prisma from '../db/client.js';
import { CreatePrizeCodeSchema, PrizeCodeFilterSchema } from '../schemas/prizecode.schema.js';
import { NotFoundError, ValidationError, ConflictError, InternalServerError } from '../utils/errors.js';
import { emailService } from './email.service.js';
import { logger } from '../logger.js';
import crypto from 'crypto';

export class PrizeCodeService {
  /**
   * Generate a cryptographically secure, unique prize code
   * Format: FRIFRI-XXXXXXXXXXXXXXXX (16 random chars base62)
   */
  private generateSecureCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomBytes = crypto.randomBytes(12); // 12 bytes = 16 base62 chars
    let code = '';
    for (let i = 0; i < randomBytes.length; i++) {
      code += chars[randomBytes[i] % chars.length];
    }
    return `FRIFRI-${code}`;
  }

  /**
   * Generate a unique prize code for a game session
   * Automatically linked to sponsor from the gameSession
   */
  async generatePrizeCodeForSession(gameSessionId: string) {
    try {
      // Get the game session to link sponsor correctly
      const gameSession = await prisma.gameSession.findUnique({
        where: { id: gameSessionId },
        include: { sponsor: true }
      });

      if (!gameSession) {
        throw new NotFoundError('Game session', gameSessionId);
      }

      if (!gameSession.sponsor) {
        throw new ValidationError('Game session has no associated sponsor');
      }
      
      if (gameSession.result !== 'win') {
        throw new ValidationError('Prize code can only be generated for winning sessions');
      }
      
      if (gameSession.playerEmail.includes('@frifri.local')) {
        throw new ValidationError('Email not confirmed for this session');
      }

      // Generate unique code with retry logic
      let code = '';
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        code = this.generateSecureCode();
        const existing = await prisma.prizeCode.findUnique({ where: { code } });
        if (!existing) break;
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new InternalServerError('Failed to generate unique prize code after multiple attempts');
      }

      // Create prize code linked to sponsor from gameSession
      const prizeCode = await prisma.prizeCode.create({
        data: {
          code,
          sponsorId: gameSession.sponsor.id,
          sponsorName: gameSession.sponsor.name,
          gameType: gameSession.gameType,
          playerEmail: gameSession.playerEmail,
          prizeDescription: gameSession.sponsor.prizeDescription,
          redeemed: false
        },
        include: { sponsor: true }
      });

      logger.info(`✅ Prize code generated: ${prizeCode.code} for player ${gameSession.playerEmail}`);

      // Send emails asynchronously (non-blocking)
      if (gameSession.playerEmail) {
        try {
          const appUrl = process.env.APP_URL || 'https://charmaway.it';
          const claimUrl = `${appUrl}/api/v1/prize-codes/${prizeCode.code}/mark-claimed`;
          
          // Email to player
          emailService.sendPrizeCodeEmail(
            gameSession.playerEmail,
            prizeCode.code,
            gameSession.sponsor.name,
            gameSession.gameType || 'Gioco',
            claimUrl,
            gameSession.playedDate || gameSession.createdAt
          ).catch((error: any) => {
            logger.error(`Failed to send prize code email for ${prizeCode.code}:`, error);
          });

          // Email to sponsor (if sponsor has email)
          if (gameSession.sponsor.contactEmail) {
            const playedDate = new Date(gameSession.createdAt).toLocaleString('it-IT', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });

            const appUrl = process.env.APP_URL || 'https://frifri.it';
            const redeemUrl = `${appUrl}/api/v1/prize-codes/${prizeCode.code}/mark-redeemed`;

            emailService.sendSponsorNotification(
              gameSession.sponsor.contactEmail,
              prizeCode.code,
              gameSession.sponsor.name,
              gameSession.sponsor.prizeDescription || 'Premio',
              gameSession.gameType || 'Gioco',
              playedDate,
              redeemUrl
            ).catch((error: any) => {
              logger.error(`Failed to send sponsor notification for ${prizeCode.code}:`, error);
            });
          }
        } catch (error: any) {
          logger.error(`Error initiating emails for prize code:`, error);
          // Non-blocking - prize already created successfully
        }
      }

      return prizeCode;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      throw new InternalServerError('Failed to generate prize code');
    }
  }

  async createPrizeCode(data: any) {
    try {
      const validated = CreatePrizeCodeSchema.parse(data);
      
      const existing = await prisma.prizeCode.findUnique({
        where: { code: validated.code }
      });
      
      if (existing) {
        throw new ConflictError(`Prize code ${validated.code} already exists`);
      }

      return await prisma.prizeCode.create({ data: validated });
    } catch (error: any) {
      if (error instanceof ConflictError || error instanceof ValidationError) throw error;
      if (error.name === 'ZodError') {
        throw new ValidationError(error.errors?.[0]?.message || 'Invalid prize code data');
      }
      throw new InternalServerError('Failed to create prize code');
    }
  }

  async getPrizeCodes(filters: any) {
    try {
      const validated = PrizeCodeFilterSchema.parse(filters);
      
      const where: any = {};
      if (validated.redeemed !== undefined) {
        where.redeemed = validated.redeemed === 'true';
      }
      if (validated.sponsorId) {
        where.sponsorId = validated.sponsorId;
      }
      if (validated.playerEmail) {
        where.playerEmail = { contains: validated.playerEmail, mode: 'insensitive' };
      }

      const [data, total] = await Promise.all([
        prisma.prizeCode.findMany({
          where,
          skip: validated.offset,
          take: validated.limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.prizeCode.count({ where })
      ]);

      return { data, total, limit: validated.limit, offset: validated.offset };
    } catch (error: any) {
      logger.error({
        err: error,
        operation: 'getPrizeCodes'
      }, 'Failed to fetch prize codes');
      throw new InternalServerError('Failed to fetch prize codes');
    }
  }

  async getPrizeCodeByCode(code: string) {
    try {
      const prizeCode = await prisma.prizeCode.findUnique({
        where: { code },
        include: { sponsor: true }
      });
      if (!prizeCode) throw new NotFoundError('Prize code', code);
      return prizeCode;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to fetch prize code');
    }
  }

  async redeemPrizeCode(code: string, playerEmail: string, sponsorIdOrAdmin?: string) {
    try {
      const prizeCode = await prisma.prizeCode.findUnique({ where: { code }, include: { sponsor: true } });
      if (!prizeCode) throw new NotFoundError('Prize code', code);
      if (prizeCode.redeemed) throw new ConflictError('Prize code already redeemed');

      // Authorization check: only admin or the sponsor can redeem
      if (sponsorIdOrAdmin && sponsorIdOrAdmin !== 'admin') {
        if (prizeCode.sponsorId !== sponsorIdOrAdmin) {
          throw new ValidationError('You can only redeem prize codes from your organization');
        }
      }

      const updated = await prisma.prizeCode.update({
        where: { code },
        data: {
          redeemed: true,
          redeemedDate: new Date(),
          playerEmail
        },
        include: { sponsor: true }
      });

      if (updated.sponsorId) {
        await prisma.sponsor.update({
          where: { id: updated.sponsorId },
          data: { redemptions: { increment: 1 } }
        });
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof ValidationError) throw error;
      throw new InternalServerError('Failed to redeem prize code');
    }
  }

  async updatePrizeCode(id: string, data: any) {
    try {
      const prizeCode = await prisma.prizeCode.findUnique({ where: { id } });
      if (!prizeCode) throw new NotFoundError('Prize code', id);

      // If marking as redeemed
      if (data.redeemed === true && !prizeCode.redeemed) {
        const updated = await prisma.prizeCode.update({
          where: { id },
          data: {
            redeemed: true,
            redeemedDate: new Date(),
            playerEmail: data.playerEmail || prizeCode.playerEmail
          },
          include: { sponsor: true }
        });

        if (updated.sponsorId) {
          await prisma.sponsor.update({
            where: { id: updated.sponsorId },
            data: { redemptions: { increment: 1 } }
          });
        }

        return updated;
      }

      // Generic update for other fields
      const updated = await prisma.prizeCode.update({
        where: { id },
        data,
        include: { sponsor: true }
      });

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to update prize code');
    }
  }

  async markPrizeCodeClaimed(code: string) {
    try {
      const prizeCode = await prisma.prizeCode.findUnique({ where: { code } });
      if (!prizeCode) throw new NotFoundError('Prize code', code);
      
      const updated = await prisma.prizeCode.update({
        where: { code },
        data: {
          claimedByPlayer: true,
          claimedByPlayerAt: new Date()
        }
      });
      
      logger.info(`Prize code claimed by player: ${code}`, {
        playerEmail: updated.playerEmail,
        sponsorId: updated.sponsorId
      });
      
      return updated;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to mark prize code as claimed');
    }
  }

  async markPrizeCodeRedeemed(code: string) {
    try {
      const prizeCode = await prisma.prizeCode.findUnique({ where: { code } });
      if (!prizeCode) throw new NotFoundError('Prize code', code);
      
      // Verify player has already claimed it
      if (!prizeCode.claimedByPlayer) {
        throw new ValidationError('Prize code must be claimed by player first');
      }
      
      const updated = await prisma.prizeCode.update({
        where: { code },
        data: {
          redeemed: true,
          redeemedDate: new Date()
        }
      });
      
      logger.info(`Prize code marked as redeemed by sponsor: ${code}`, {
        playerEmail: updated.playerEmail,
        sponsorId: updated.sponsorId
      });
      
      return updated;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      throw new InternalServerError('Failed to mark prize code as redeemed');
    }
  }

  async deletePrizeCode(id: string) {
    try {
      const prizeCode = await prisma.prizeCode.findUnique({ where: { id } });
      if (!prizeCode) throw new NotFoundError('Prize code', id);
      return await prisma.prizeCode.delete({ where: { id } });
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to delete prize code');
    }
  }
}

export const prizeCodeService = new PrizeCodeService();
