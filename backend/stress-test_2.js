import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const loginTrend = new Trend('login_duration');
const profileTrend = new Trend('profile_duration');
const accomplishmentTrend = new Trend('accomplishment_duration');
const workExpTrend = new Trend('work_exp_duration');
const interviewTrend = new Trend('interview_duration');
const careerVisionTrend = new Trend('career_vision_duration');
const coverLetterTrend = new Trend('cover_letter_duration');
const parStoriesTrend = new Trend('par_stories_duration');
const accomplishmentBankTrend = new Trend('accomplishment_bank_duration');

const BASE_URL = __ENV.BASE_URL;
const EMAIL = __ENV.EMAIL;
const PASSWORD = __ENV.PASSWORD;
const API_KEY = __ENV.API_KEY;

export const options = {
    scenarios: {
        stress_test: {
            executor: 'ramping-vus',
            startVUs: 5,
            stages: [
                { duration: '1m', target: 50 },
                { duration: '1m', target: 100 },
                { duration: '1m', target: 150 },
                { duration: '1m', target: 200 },
                { duration: '30s', target: 0 },
            ],
            gracefulRampDown: '10s',
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.20'],
        http_req_duration: ['p(95)<3000'],
        errors: ['rate<0.20'],
        login_duration: ['p(95)<2500'],
        profile_duration: ['p(95)<2000'],
        accomplishment_duration: ['p(95)<2500'],
        work_exp_duration: ['p(95)<2500'],
        interview_duration: ['p(95)<2500'],
        career_vision_duration: ['p(95)<3000'],
        cover_letter_duration: ['p(95)<3000'],
        par_stories_duration: ['p(95)<2500'],
        accomplishment_bank_duration: ['p(95)<2500'],
    },
};

let sessionTokens = {};

function getAuthHeaders(accessToken) {
    return {
        headers: {
            'Accept': 'application/json',
            'apikey': API_KEY,
            'Authorization': `Bearer ${accessToken}`,
        },
    };
}

export default function () {
    const vuId = __VU;

    if (!sessionTokens[vuId]) {
        const loginPayload = JSON.stringify({ email: EMAIL, password: PASSWORD });
        const loginHeaders = {
            headers: {
                'Content-Type': 'application/json',
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

        if (!check(loginRes, { 'login status 200': (r) => r.status === 200 })) {
            sleep(2);
            return;
        }

        sessionTokens[vuId] = {
            accessToken: loginRes.json('access_token'),
            refreshToken: loginRes.json('refresh_token'),
        };
    }

    if (!sessionTokens[vuId]) {
        sleep(1);
        return;
    }

    const accessToken = sessionTokens[vuId].accessToken;
    const headers = getAuthHeaders(accessToken);
    const rand = Math.random();

    // === 60% LECTURAS LIGERAS ===
    if (rand < 0.30) {
        const res = http.get(`${BASE_URL}/rest/v1/user_profiles?select=*`, headers);
        profileTrend.add(res.timings.duration);
        if (!check(res, { 'profile 200': (r) => r.status === 200 })) {
            if (res.status === 401) delete sessionTokens[vuId];
            errorRate.add(1);
        }
    } else if (rand < 0.45) {
        const res = http.get(`${BASE_URL}/rest/v1/par_stories?select=*&limit=20`, headers);
        parStoriesTrend.add(res.timings.duration);
        if (!check(res, { 'par_stories 200': (r) => r.status === 200 })) {
            if (res.status === 401) delete sessionTokens[vuId];
            errorRate.add(1);
        }
    } else if (rand < 0.60) {
        const res = http.get(`${BASE_URL}/rest/v1/users?select=id&limit=1`, {
            headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` }
        });
        if (res.status !== 200) errorRate.add(1);
    }

    // === 25% LECTURAS MEDIANAS ===
    else if (rand < 0.70) {
        const res = http.get(`${BASE_URL}/rest/v1/accomplishments?select=*&limit=20`, headers);
        accomplishmentTrend.add(res.timings.duration);
        if (!check(res, { 'accomplishments 200': (r) => r.status === 200 })) {
            if (res.status === 401) delete sessionTokens[vuId];
            errorRate.add(1);
        }
    } else if (rand < 0.80) {
        const res = http.get(`${BASE_URL}/rest/v1/work_experience?select=*&limit=20`, headers);
        workExpTrend.add(res.timings.duration);
        if (!check(res, { 'work_experience 200': (r) => r.status === 200 })) {
            if (res.status === 401) delete sessionTokens[vuId];
            errorRate.add(1);
        }
    } else if (rand < 0.85) {
        const res = http.get(`${BASE_URL}/rest/v1/interviews?select=*&limit=20`, headers);
        interviewTrend.add(res.timings.duration);
        if (!check(res, { 'interviews 200': (r) => r.status === 200 })) {
            if (res.status === 401) delete sessionTokens[vuId];
            errorRate.add(1);
        }
    }

    // === 15% LECTURAS PESADAS (joins/agregaciones) ===
    else if (rand < 0.90) {
        const res = http.get(`${BASE_URL}/rest/v1/career_vision_profiles?select=*`, headers);
        careerVisionTrend.add(res.timings.duration);
        if (!check(res, { 'career_vision_profiles 200': (r) => r.status === 200 })) {
            if (res.status === 401) delete sessionTokens[vuId];
            errorRate.add(1);
        }
    } else if (rand < 0.95) {
        const res = http.get(`${BASE_URL}/rest/v1/accomplishment_bank?select=*&limit=20`, headers);
        accomplishmentBankTrend.add(res.timings.duration);
        if (!check(res, { 'accomplishment_bank 200': (r) => r.status === 200 })) {
            if (res.status === 401) delete sessionTokens[vuId];
            errorRate.add(1);
        }
    } else {
        const res = http.get(`${BASE_URL}/rest/v1/cover_letters?select=*&limit=20`, headers);
        coverLetterTrend.add(res.timings.duration);
        if (!check(res, { 'cover-letters 200': (r) => r.status === 200 })) {
            if (res.status === 401) delete sessionTokens[vuId];
            errorRate.add(1);
        }
    }

    const res2 = http.get(`${BASE_URL}/rest/v1/user_profiles?select=*`, headers);
    profileTrend.add(res2.timings.duration);

    sleep(1);
}
