import { PrismaClient } from '@prisma/client';
import { logger } from '../logger.js';

const prisma = new PrismaClient();

export class EventService {
  async getAllEvents(active?: boolean) {
    try {
      const where = active !== undefined ? { active } : {};
      const events = await prisma.event.findMany({
        where,
        orderBy: { order: 'asc' },
      });
      return events;
    } catch (error) {
      logger.error('Error fetching events:', error);
      throw error;
    }
  }

  async getEventById(id: string) {
    try {
      const event = await prisma.event.findUnique({
        where: { id },
      });
      return event;
    } catch (error) {
      logger.error('Error fetching event:', error);
      throw error;
    }
  }

  async createEvent(data: {
    title: string;
    description: string;
    date?: Date;
    location?: string;
    bgColor?: string;
    textColor?: string;
    order?: number;
  }) {
    try {
      const event = await prisma.event.create({
        data: {
          title: data.title,
          description: data.description,
          date: data.date || null,
          location: data.location || null,
          bgColor: data.bgColor || '#2D1B69',
          textColor: data.textColor || '#FFFFFF',
          order: data.order || 0,
          active: true,
        },
      });
      return event;
    } catch (error) {
      logger.error('Error creating event:', error);
      throw error;
    }
  }

  async updateEvent(
    id: string,
    data: {
      title?: string;
      description?: string;
      date?: Date | null;
      location?: string | null;
      bgColor?: string;
      textColor?: string;
      active?: boolean;
      order?: number;
    }
  ) {
    try {
      const event = await prisma.event.update({
        where: { id },
        data,
      });
      return event;
    } catch (error) {
      logger.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(id: string) {
    try {
      const event = await prisma.event.delete({
        where: { id },
      });
      return event;
    } catch (error) {
      logger.error('Error deleting event:', error);
      throw error;
    }
  }

  async toggleEventActive(id: string) {
    try {
      const event = await prisma.event.findUnique({ where: { id } });
      if (!event) throw new Error('Event not found');

      const updated = await prisma.event.update({
        where: { id },
        data: { active: !event.active },
      });
      return updated;
    } catch (error) {
      logger.error('Error toggling event:', error);
      throw error;
    }
  }
}

export const eventService = new EventService();
