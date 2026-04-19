/**
 * Tests for smartMatchTranslator.
 *
 * Run with: node --test backend/services/__tests__/smartMatchTranslator.test.js
 *
 * Guarantees:
 * - Raw vendor terms never leak into the translated output.
 * - Vendor field names map to the agreed neutral names.
 * - Missing fields become null rather than undefined.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  translateSnapshot,
  translateMatchResult,
} from '../smartMatchTranslator.js'

const RAW_SNAPSHOT = {
  company_id: 'abc-123',
  domain: 'acme.example',
  friction_score: 82,
  main_pain: 'Growth stalled after series B',
  where_pain_lives: 'RevOps and forecasting',
  what_the_company_needs: 'A revenue operator who can rebuild forecasting',
  best_attack_angle: 'Lead with your quota-turnaround case study',
  inferred_sector: 'B2B SaaS',
  refreshed_at: '2026-04-18T00:00:00Z',
  confidence: 0.72,
  kpis: { churn: 'high' },
  diagnostic_state: 'ok',
  eligibility_gate: 'passed',
}

const RAW_MATCH = {
  company_id: 'abc-123',
  domain: 'acme.example',
  fit_score: 74,
  rationale: 'Your two revenue turnarounds map directly to the gap.',
  snapshot: RAW_SNAPSHOT,
}

const FORBIDDEN_KEYS = [
  'friction_score',
  'main_pain',
  'where_pain_lives',
  'what_the_company_needs',
  'best_attack_angle',
  'fit_score',
  'rationale',
  'confidence',
  'kpis',
  'diagnostic_state',
  'eligibility_gate',
]

function assertNoForbiddenKeys(obj, path = '') {
  if (obj === null || typeof obj !== 'object') return
  for (const key of Object.keys(obj)) {
    assert.ok(
      !FORBIDDEN_KEYS.includes(key),
      `Forbidden vendor key "${key}" found at ${path || '<root>'}`,
    )
    assertNoForbiddenKeys(obj[key], `${path}.${key}`)
  }
}

test('translateSnapshot maps vendor fields to neutral names', () => {
  const out = translateSnapshot(RAW_SNAPSHOT)

  assert.equal(out.company_id, 'abc-123')
  assert.equal(out.domain, 'acme.example')
  assert.equal(out.opportunity_score, 82)
  assert.equal(out.match_insight, 'Growth stalled after series B')
  assert.equal(out.relevant_area, 'RevOps and forecasting')
  assert.equal(
    out.what_they_seek,
    'A revenue operator who can rebuild forecasting',
  )
  assert.equal(
    out.positioning_angle,
    'Lead with your quota-turnaround case study',
  )
  assert.equal(out.inferred_sector, 'B2B SaaS')
  assert.equal(out.refreshed_at, '2026-04-18T00:00:00Z')
})

test('translateSnapshot strips all vendor-only keys', () => {
  const out = translateSnapshot(RAW_SNAPSHOT)
  assertNoForbiddenKeys(out)
})

test('translateMatchResult wraps snapshot and maps score + rationale', () => {
  const out = translateMatchResult(RAW_MATCH)

  assert.equal(out.company_id, 'abc-123')
  assert.equal(out.domain, 'acme.example')
  assert.equal(out.match_score, 74)
  assert.equal(
    out.match_rationale,
    'Your two revenue turnarounds map directly to the gap.',
  )
  assert.ok(out.snapshot_neutral, 'snapshot_neutral should be present')
  assert.equal(out.snapshot_neutral.opportunity_score, 82)
})

test('translateMatchResult strips all vendor-only keys (including nested)', () => {
  const out = translateMatchResult(RAW_MATCH)
  assertNoForbiddenKeys(out)
})

test('translators return null for invalid input', () => {
  assert.equal(translateSnapshot(null), null)
  assert.equal(translateSnapshot(undefined), null)
  assert.equal(translateSnapshot('string'), null)
  assert.equal(translateMatchResult(null), null)
  assert.equal(translateMatchResult(42), null)
})

test('numeric coercion falls back to null for non-numbers', () => {
  const out = translateSnapshot({ ...RAW_SNAPSHOT, friction_score: 'n/a' })
  assert.equal(out.opportunity_score, null)
})

test('missing optional fields become null, not undefined', () => {
  const out = translateSnapshot({ company_id: 'x', domain: 'y.example' })
  assert.equal(out.match_insight, null)
  assert.equal(out.relevant_area, null)
  assert.equal(out.what_they_seek, null)
  assert.equal(out.positioning_angle, null)
  assert.equal(out.opportunity_score, null)
})

test('open_roles passthrough preserves array of normalized items', () => {
  const raw = {
    ...RAW_SNAPSHOT,
    open_roles: [
      {
        title: 'Senior Backend Engineer',
        url: 'https://jobs.acme.example/123',
        functional_area: 'engineering',
        location: 'Austin, TX',
      },
      {
        title: 'Recruiter',
        url: null,
        functional_area: 'hr',
        location: null,
      },
    ],
  }
  const out = translateSnapshot(raw)
  assert.ok(Array.isArray(out.open_roles))
  assert.equal(out.open_roles.length, 2)
  assert.equal(out.open_roles[0].title, 'Senior Backend Engineer')
  assert.equal(out.open_roles[0].url, 'https://jobs.acme.example/123')
  assert.equal(out.open_roles[0].functional_area, 'engineering')
  assert.equal(out.open_roles[0].location, 'Austin, TX')
  assert.equal(out.open_roles[1].url, null)
  assert.equal(out.open_roles[1].location, null)
})

test('open_roles defaults to empty array when missing or invalid', () => {
  assert.deepEqual(translateSnapshot({ company_id: 'x', domain: 'y.example' }).open_roles, [])
  assert.deepEqual(
    translateSnapshot({ ...RAW_SNAPSHOT, open_roles: 'not-an-array' }).open_roles,
    [],
  )
  assert.deepEqual(
    translateSnapshot({ ...RAW_SNAPSHOT, open_roles: null }).open_roles,
    [],
  )
})

test('open_roles is capped at 5 items defensively', () => {
  const many = Array.from({ length: 9 }, (_, i) => ({
    title: `Role ${i}`,
    url: null,
    functional_area: 'engineering',
    location: null,
  }))
  const out = translateSnapshot({ ...RAW_SNAPSHOT, open_roles: many })
  assert.equal(out.open_roles.length, 5)
})

test('open_roles fields missing on an item default to null', () => {
  const out = translateSnapshot({
    ...RAW_SNAPSHOT,
    open_roles: [{ title: 'Engineer' }],
  })
  assert.equal(out.open_roles[0].title, 'Engineer')
  assert.equal(out.open_roles[0].url, null)
  assert.equal(out.open_roles[0].functional_area, null)
  assert.equal(out.open_roles[0].location, null)
})

test('detection_evidence passthrough preserves known fields', () => {
  const out = translateSnapshot({
    ...RAW_SNAPSHOT,
    detection_evidence: {
      signals_analyzed: 52,
      roles_tracked: 19,
      last_signal_at: '2026-04-17',
    },
  })
  assert.equal(out.detection_evidence.signals_analyzed, 52)
  assert.equal(out.detection_evidence.roles_tracked, 19)
  assert.equal(out.detection_evidence.last_signal_at, '2026-04-17')
})

test('detection_evidence is null when missing or invalid', () => {
  assert.equal(translateSnapshot(RAW_SNAPSHOT).detection_evidence, null)
  assert.equal(
    translateSnapshot({ ...RAW_SNAPSHOT, detection_evidence: 'invalid' }).detection_evidence,
    null,
  )
})

test('detection_evidence coerces non-number counts to null', () => {
  const out = translateSnapshot({
    ...RAW_SNAPSHOT,
    detection_evidence: {
      signals_analyzed: 'many',
      roles_tracked: null,
      last_signal_at: null,
    },
  })
  assert.equal(out.detection_evidence.signals_analyzed, null)
  assert.equal(out.detection_evidence.roles_tracked, null)
  assert.equal(out.detection_evidence.last_signal_at, null)
})
