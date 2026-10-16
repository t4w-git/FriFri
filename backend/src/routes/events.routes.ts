import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { eventService } from '../services/event.service.js';
import { logger } from '../logger.js';

const router = Router();

// GET all active events (public)
router.get('/public/events', async (_req, res) => {
  try {
    const events = await eventService.getAllEvents(true);
    res.json({ data: events });
  } catch (error) {
    logger.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Admin routes (protected)

// GET all events (admin)
router.get('/admin/events', authMiddleware, async (_req, res) => {
  try {
    const events = await eventService.getAllEvents();
    res.json({ data: events });
  } catch (error) {
    logger.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET single event (admin)
router.get('/admin/events/:id', authMiddleware, async (req, res) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json({ data: event });
  } catch (error) {
    logger.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// POST create event (admin)
router.post('/admin/events', authMiddleware, async (req, res) => {
  try {
    const { title, description, date, location, bgColor, textColor, order } = req.body;

    if (!title || !description) {
      res.status(400).json({ error: 'Title and description required' });
      return;
    }

    const event = await eventService.createEvent({
      title,
      description,
      date: date ? new Date(date) : undefined,
      location,
      bgColor,
      textColor,
      order,
    });

    res.status(201).json({ data: event });
  } catch (error) {
    logger.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT update event (admin)
router.put('/admin/events/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, date, location, bgColor, textColor, active, order } = req.body;

    const event = await eventService.updateEvent(req.params.id, {
      title,
      description,
      date: date ? new Date(date) : date === null ? null : undefined,
      location,
      bgColor,
      textColor,
      active,
      order,
    });

    res.json({ data: event });
  } catch (error) {
    logger.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE event (admin)
router.delete('/admin/events/:id', authMiddleware, async (req, res) => {
  try {
    await eventService.deleteEvent(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (error) {
    logger.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// PATCH toggle active (admin)
router.patch('/admin/events/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const event = await eventService.toggleEventActive(req.params.id);
    res.json({ data: event });
  } catch (error) {
    logger.error('Error toggling event:', error);
    res.status(500).json({ error: 'Failed to toggle event' });
  }
});

export default router;
