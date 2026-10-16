import prisma from '../db/client.js';
import { CreateNewsletterSubscriberSchema, NewsletterFilterSchema } from '../schemas/newsletter.schema.js';
import { NotFoundError, ValidationError, ConflictError, InternalServerError } from '../utils/errors.js';
import { emailService } from './email.service.js';

export class NewsletterService {
  async subscribe(data: any) {
    try {
      const validated = CreateNewsletterSubscriberSchema.parse(data);
      
      const existing = await prisma.newsletterSubscriber.findUnique({
        where: { email: validated.email }
      });
      
      if (existing) {
        if (existing.active) {
          throw new ConflictError(`Email ${validated.email} is already subscribed`);
        }
        const updated = await prisma.newsletterSubscriber.update({
          where: { email: validated.email },
          data: { active: true }
        });
        // Send welcome email when reactivating
        await emailService.sendNewsletterWelcome(validated.email);
        return updated;
      }

      const subscriber = await prisma.newsletterSubscriber.create({ data: validated });
      // Send welcome email to new subscriber
      await emailService.sendNewsletterWelcome(validated.email);
      return subscriber;
    } catch (error: any) {
      if (error instanceof ConflictError) throw error;
      if (error.name === 'ZodError') {
        throw new ValidationError(error.errors?.[0]?.message || 'Invalid email');
      }
      throw new InternalServerError('Failed to subscribe');
    }
  }

  async getSubscribers(filters: any) {
    try {
      const validated = NewsletterFilterSchema.parse(filters);
      
      const where: any = {};
      if (validated.active !== undefined) {
        where.active = validated.active === 'true';
      }

      const [data, total] = await Promise.all([
        prisma.newsletterSubscriber.findMany({
          where,
          skip: validated.offset,
          take: validated.limit,
          orderBy: { [validated.sortBy]: validated.sortOrder }
        }),
        prisma.newsletterSubscriber.count({ where })
      ]);

      return { data, total, limit: validated.limit, offset: validated.offset };
    } catch (error) {
      throw new InternalServerError('Failed to fetch subscribers');
    }
  }

  async unsubscribe(email: string) {
    try {
      const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { email } });
      if (!subscriber) throw new NotFoundError('Subscriber', email);

      return await prisma.newsletterSubscriber.update({
        where: { email },
        data: { active: false }
      });
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to unsubscribe');
    }
  }

  async deleteSubscriber(id: string) {
    try {
      const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { id } });
      if (!subscriber) throw new NotFoundError('Subscriber', id);
      return await prisma.newsletterSubscriber.delete({ where: { id } });
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new InternalServerError('Failed to delete subscriber');
    }
  }

  async getStats() {
    try {
      const totalSubscribers = await prisma.newsletterSubscriber.count();
      const activeSubscribers = await prisma.newsletterSubscriber.count({ where: { active: true } });
      const inactiveSubscribers = await prisma.newsletterSubscriber.count({ where: { active: false } });

      return {
        total: totalSubscribers,
        active: activeSubscribers,
        inactive: inactiveSubscribers,
        activePercentage: totalSubscribers > 0 ? (activeSubscribers / totalSubscribers) * 100 : 0
      };
    } catch (error) {
      throw new InternalServerError('Failed to fetch newsletter stats');
    }
  }

  async sendNewsletter(subject: string, body: string) {
    try {
      const subscribers = await prisma.newsletterSubscriber.findMany({ where: { active: true } });
      
      // Send to each subscriber with personalized unsubscribe URL
      await Promise.all(
        subscribers.map(async (sub) => {
          const html = await emailService.generateNewsletterHtml(subject, body, sub.email);
          await emailService.sendEmail({
            to: sub.email,
            subject,
            html,
          });
        })
      );
      return { sent: subscribers.length };
    } catch (error) {
      throw new InternalServerError('Failed to send newsletter');
    }
  }
}

export const newsletterService = new NewsletterService();
