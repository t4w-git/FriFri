// Load Testing Configuration with k6
// Run: k6 run performance.test.js

import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  vus: 10, // Virtual users
  duration: '30s', // Test duration
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95th percentile < 500ms, 99th < 1s
    http_req_failed: ['rate<0.1'], // Error rate < 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'your_jwt_token_here';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AUTH_TOKEN}`,
  };

  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 100ms': (r) => r.timings.duration < 100,
    });
  });

  sleep(1);

  group('Poems API', () => {
    // List poems
    const listRes = http.get(`${BASE_URL}/api/v1/poems?limit=10&offset=0`, { headers });
    check(listRes, {
      'list status is 200 or 401': (r) => [200, 401].includes(r.status),
      'list response time < 500ms': (r) => r.timings.duration < 500,
    });

    if (listRes.status === 200) {
      const poems = JSON.parse(listRes.body);
      if (poems.data && poems.data.length > 0) {
        // Get single poem
        const poemId = poems.data[0].id;
        const getRes = http.get(`${BASE_URL}/api/v1/poems/${poemId}`, { headers });
        check(getRes, {
          'get status is 200': (r) => r.status === 200,
          'get response time < 200ms': (r) => r.timings.duration < 200,
        });
      }
    }
  });

  sleep(1);

  group('Game Sessions API', () => {
    // Create game session
    const createRes = http.post(
      `${BASE_URL}/api/v1/game-sessions`,
      JSON.stringify({
        gameType: 'gioco_poesie',
        playerEmail: `player-${Math.random()}@example.com`,
        result: 'win',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(createRes, {
      'create status is 201 or 400': (r) => [201, 400].includes(r.status),
      'create response time < 300ms': (r) => r.timings.duration < 300,
    });

    sleep(0.5);

    // List game sessions
    const listRes = http.get(`${BASE_URL}/api/v1/game-sessions?limit=10`, { headers });
    check(listRes, {
      'list status is 200 or 401': (r) => [200, 401].includes(r.status),
    });
  });

  sleep(1);

  group('Newsletter API', () => {
    // Subscribe
    const subscribeRes = http.post(
      `${BASE_URL}/api/v1/newsletter/subscribe`,
      JSON.stringify({
        email: `subscriber-${Math.random()}@example.com`,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(subscribeRes, {
      'subscribe status is 201 or 409': (r) => [201, 409].includes(r.status),
      'subscribe response time < 300ms': (r) => r.timings.duration < 300,
    });
  });

  sleep(1);

  group('Sponsors API', () => {
    const listRes = http.get(`${BASE_URL}/api/v1/sponsors?tier=gold`, { headers });
    check(listRes, {
      'list status is 200 or 401': (r) => [200, 401].includes(r.status),
      'list response time < 400ms': (r) => r.timings.duration < 400,
    });
  });

  sleep(1);

  group('Admin Dashboard', () => {
    const dashRes = http.get(`${BASE_URL}/api/v1/admin/dashboard`, { headers });
    check(dashRes, {
      'dashboard status is 200 or 401': (r) => [200, 401].includes(r.status),
      'dashboard response time < 1000ms': (r) => r.timings.duration < 1000,
    });
  });

  sleep(2);
}

/**
 * Run load test:
 * k6 run performance.test.js
 * 
 * Run with custom settings:
 * k6 run --vus 50 --duration 60s performance.test.js
 * 
 * Run with auth token:
 * k6 run --env AUTH_TOKEN=your_token_here performance.test.js
 * 
 * Run cloud test:
 * k6 cloud performance.test.js
 */
