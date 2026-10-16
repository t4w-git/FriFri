import prisma from '../db/client.js';
import { CreateSponsorSchema, UpdateSponsorSchema, SponsorFilterSchema } from '../schemas/sponsor.schema.js';
import { NotFoundError, ValidationError, InternalServerError } from '../utils/errors.js';

export class SponsorService {
  async createSponsor(data: any) {
    try {
      const validated = CreateSponsorSchema.parse(data);
      return await prisma.sponsor.create({ data: validated });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw new ValidationError(error.errors?.[0]?.message || 'Invalid sponsor data');
      }
      throw new InternalServerError('Failed to create sponsor');
    }
  }

  async getSponsors(filters: any) {
    try {
      const validated = SponsorFilterSchema.parse(filters);
      
      const where: any = {};
      if (validated.active !== undefined) {
        where.active = validated.active === 'true';
      }
      if (validated.tier) {
        where.tier = validated.tier;
      }
      if (validated.gameType) {
        where.gameType = { in: [validated.gameType, 'tutti'] };
      }

      const [data, total] = await Promise.all([
        prisma.sponsor.findMany({
          where,
          skip: validated.offset,
          take: validated.limit,
          orderBy: { [validated.sortBy]: validated.sortOrder }
        }),
        prisma.sponsor.count({ where })
      ]);

      return { data, total, limit: validated.limit, offset: validated.offset };
    } catch (error) {
      throw new InternalServerError('Failed to fetch sponsors');
    }
  }

  async getSponsorById(id: string) {
    try {
      const sponsor = await prisma.sponsor.findUnique({ 
        where: { id },
        include: { prizeCodes: true }
      });
      if (!sponsor) throw new NotFoundError('Sponsor', id);
      return sponsor;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to fetch sponsor');
    }
  }

  async updateSponsor(id: string, data: any) {
    try {
      const validated = UpdateSponsorSchema.parse(data);
      const sponsor = await prisma.sponsor.findUnique({ where: { id } });
      if (!sponsor) throw new NotFoundError('Sponsor', id);

      return await prisma.sponsor.update({
        where: { id },
        data: validated
      });
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to update sponsor');
    }
  }

  async deleteSponsor(id: string) {
    try {
      const sponsor = await prisma.sponsor.findUnique({ where: { id } });
      if (!sponsor) throw new NotFoundError('Sponsor', id);
      return await prisma.sponsor.delete({ where: { id } });
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to delete sponsor');
    }
  }

  async trackView(id: string) {
    try {
      return await prisma.sponsor.update({
        where: { id },
        data: { views: { increment: 1 } }
      });
    } catch (error) {
      throw new InternalServerError('Failed to track view');
    }
  }

  async trackPlay(id: string) {
    try {
      return await prisma.sponsor.update({
        where: { id },
        data: { plays: { increment: 1 } }
      });
    } catch (error) {
      throw new InternalServerError('Failed to track play');
    }
  }

  async trackRedemption(id: string) {
    try {
      return await prisma.sponsor.update({
        where: { id },
        data: { redemptions: { increment: 1 } }
      });
    } catch (error) {
      throw new InternalServerError('Failed to track redemption');
    }
  }
}

export const sponsorService = new SponsorService();
