import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const loginTrend = new Trend('login_duration');
const profileTrend = new Trend('profile_duration');

const BASE_URL = __ENV.BASE_URL;
const EMAIL = __ENV.EMAIL;
const PASSWORD = __ENV.PASSWORD;
const API_KEY = __ENV.API_KEY;

export const options = {
  scenarios: {
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
    errors: ['rate<0.05'],
    login_duration: ['p(95)<2500'],
    profile_duration: ['p(95)<2000'],
  },
};

let sessionTokens = {};

export default function () {
  const vuId = __VU;

  if (!sessionTokens[vuId]) {
    const loginPayload = JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
    });

    const loginHeaders = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
      },
    };

    const loginRes = http.post(
      `${BASE_URL}/auth/v1/token?grant_type=password`,
      loginPayload,
      loginHeaders
    );

    loginTrend.add(loginRes.timings.duration);

    const loginOk = check(loginRes, {
      'login status 200': (r) => r.status === 200,
      'login has access_token': (r) => {
        try {
          return !!r.json('access_token');
        } catch {
          return false;
        }
      },
    });

    if (!loginOk) {
      errorRate.add(1);
      sleep(1);
      return;
    }

    sessionTokens[vuId] = {
      accessToken: loginRes.json('access_token'),
      refreshToken: loginRes.json('refresh_token'),
    };
  }

  const profileHeaders = {
    headers: {
      'Accept': 'application/json',
      'apikey': API_KEY,
      'Authorization': `Bearer ${sessionTokens[vuId].accessToken}`,
    },
  };

  const profileRes = http.get(
    `${BASE_URL}/rest/v1/user_profiles?select=*`,
    profileHeaders
  );

  profileTrend.add(profileRes.timings.duration);

  const profileOk = check(profileRes, {
    'profiles status 200': (r) => r.status === 200,
    'profiles returns json': (r) =>
      r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
  });

  if (!profileOk) {
    if (profileRes.status === 401) {
      delete sessionTokens[vuId];
    }
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  sleep(5);
}
