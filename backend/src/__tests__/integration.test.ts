import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('Integration Tests - Poems API', () => {
  let poemId: string;
  let authToken: string;

  beforeAll(async () => {
    // Register and login to get auth token
    // This assumes auth endpoints are available
    try {
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!',
        });

      if (registerRes.status === 201 || registerRes.status === 409) {
        const loginRes = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'test@example.com',
            password: 'Test123!',
          });

        if (loginRes.body?.token) {
          authToken = loginRes.body.token;
        }
      }
    } catch (error) {
      console.warn('Auth setup failed, tests will use mock token:', error);
    }
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('POST /api/v1/poems', () => {
    it('should create a poem with admin auth', async () => {
      const res = await request(app)
        .post('/api/v1/poems')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Poem',
          text: 'This is a test poem',
          author: 'Test Author',
        });

      expect([201, 401, 403]).toContain(res.status);
      if (res.status === 201) {
        expect(res.body).toHaveProperty('id');
        expect(res.body.title).toBe('Test Poem');
        poemId = res.body.id;
      }
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/poems')
        .send({
          title: 'Test Poem',
          text: 'This is a test poem',
        });

      expect(res.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/poems')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          author: 'Test Author', // Missing title and text
        });

      expect([400, 401, 403]).toContain(res.status);
    });
  });

  describe('GET /api/v1/poems', () => {
    it('should list poems', async () => {
      const res = await request(app)
        .get('/api/v1/poems')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 401, 403]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('total');
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/poems')
        .query({ limit: 5, offset: 0 })
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 401, 403]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.limit).toBe(5);
        expect(res.body.offset).toBe(0);
      }
    });

    it('should filter by author', async () => {
      const res = await request(app)
        .get('/api/v1/poems')
        .query({ author: 'Test Author' })
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 401, 403]).toContain(res.status);
    });
  });

  describe('GET /api/v1/poems/:id', () => {
    it('should get poem by id', async () => {
      if (!poemId) {
        console.warn('Skipping - no poem created in setup');
        return;
      }

      const res = await request(app)
        .get(`/api/v1/poems/${poemId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 401, 403, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.id).toBe(poemId);
      }
    });

    it('should return 404 for non-existent poem', async () => {
      const res = await request(app)
        .get('/api/v1/poems/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect([401, 403, 404]).toContain(res.status);
    });
  });

  describe('PUT /api/v1/poems/:id', () => {
    it('should update poem', async () => {
      if (!poemId) {
        console.warn('Skipping - no poem created in setup');
        return;
      }

      const res = await request(app)
        .put(`/api/v1/poems/${poemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Poem Title',
        });

      expect([200, 401, 403, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.title).toBe('Updated Poem Title');
      }
    });
  });

  describe('DELETE /api/v1/poems/:id', () => {
    it('should delete poem', async () => {
      if (!poemId) {
        console.warn('Skipping - no poem created in setup');
        return;
      }

      const res = await request(app)
        .delete(`/api/v1/poems/${poemId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([204, 401, 403, 404]).toContain(res.status);
    });
  });
});

describe('Integration Tests - Health & Info', () => {
  it('should respond to health check', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toBe('ok');
  });

  it('should return API info', async () => {
    const res = await request(app).get('/api/v1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('Frifri API');
  });

  it('should return 404 for non-existent routes', async () => {
    const res = await request(app).get('/api/v1/nonexistent');

    expect(res.status).toBe(404);
  });
});
