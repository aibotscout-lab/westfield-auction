import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 100 },   // Ramp up to 100 users
    { duration: '30s', target: 100 },  // Hold at 100 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.05'],    // Less than 5% failures
  },
};

const BASE_URL = 'https://westfield-auction.vercel.app';

export default function () {
  // Hit the main page (simulates user loading auction)
  const mainPage = http.get(BASE_URL);
  check(mainPage, {
    'main page loads': (r) => r.status === 200,
    'main page fast': (r) => r.timings.duration < 2000,
  });

  sleep(Math.random() * 3 + 1); // Random 1-4 second pause (simulates user reading)

  // Hit API endpoint if there's one for items
  const apiItems = http.get(`${BASE_URL}/api/items`, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(apiItems, {
    'API responds': (r) => r.status === 200 || r.status === 404,
  });

  sleep(Math.random() * 2 + 1);
}
