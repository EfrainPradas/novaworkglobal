/**
 * Tests for cvPersonalization.
 *
 * Run with: node --test backend/services/__tests__/cvPersonalization.test.js
 *
 * Covers:
 * - Happy path: returns upserted row with pain_interpretation + 5-8 bullets.
 * - pain_hook + pain_interpretation are persisted per the new prompt contract.
 * - Error: no master resume → NO_MASTER_RESUME
 * - Error: LLM returns wrong bullet count → LLM_BAD_OUTPUT
 * - Error: LLM returns non-JSON → LLM_BAD_OUTPUT
 * - Error: bullet missing pain_hook → LLM_BAD_OUTPUT
 * - Error: missing pain_interpretation → LLM_BAD_OUTPUT
 * - Language: prompt declares target language; defaults to English.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { generateTailoredCv, CvPersonalizationError } from '../cvPersonalization.js'

const BRIEF_ROW = {
  id: 'brief-1',
  user_id: 'user-1',
  domain: 'acme.example',
  snapshot_neutral: {
    positioning_angle: 'Lead with your revenue turnaround case study',
    what_they_seek: 'A revenue operator who can rebuild forecasting',
    match_insight: 'Sales forecast has been missing by 20% for 3 quarters',
    relevant_area: 'RevOps / Finance',
    inferred_sector: 'B2B SaaS',
    open_roles: [{ title: 'VP RevOps', url: null, functional_area: 'revops', location: null }],
  },
}

const MASTER_RESUME_ROW = {
  id: 'resume-1',
  profile_summary: 'Revenue operator with 10+ years rebuilding forecasting systems.',
  updated_at: '2026-04-18T00:00:00Z',
}

function makeBullets(n) {
  return Array.from({ length: n }, (_, i) => ({ bullet_text: `Accomplishment #${i}` }))
}

function makeValidLlmPayload({ count = 7 } = {}) {
  return {
    pain_interpretation: 'Forecasting failure undermines board trust; rebuild the funnel-to-ARR machine fast.',
    profile_summary_tailored:
      'Revenue operator known for rebuilding forecasting after scale shocks. Track record turning around RevOps at Series B+ SaaS.',
    bullets_tailored: Array.from({ length: count }, (_, i) => ({
      original_index: i,
      tailored_text: `Tailored bullet ${i}`,
      pain_hook: `Proves fix for forecast gap ${i}`,
    })),
    gaps: null,
    rejected_bullets: [
      { original_index: 15, reason: 'Generic cross-functional leadership, no forecast signal.' },
    ],
  }
}

function makeSupabase(options) {
  const {
    briefResponse = { data: BRIEF_ROW, error: null },
    masterResumeResponse = { data: [MASTER_RESUME_ROW], error: null },
    bulletsResponse = { data: makeBullets(20), error: null },
    upsertResponse,
  } = options

  const upsertCalls = []

  function from(table) {
    if (table === 'smart_match_briefs') {
      return buildChain(briefResponse, { terminal: 'maybeSingle' })
    }
    if (table === 'user_resumes') {
      return buildChain(masterResumeResponse, { terminal: 'limit' })
    }
    if (table === 'accomplishment_bank') {
      return buildChain(bulletsResponse, { terminal: 'limit' })
    }
    if (table === 'smart_match_cv_versions') {
      return {
        upsert(row, opts) {
          upsertCalls.push({ row, opts })
          return {
            select() {
              return {
                single: async () =>
                  upsertResponse || { data: { ...row, id: 'cv-version-1', created_at: '2026-04-19T00:00:00Z' }, error: null },
              }
            },
          }
        },
      }
    }
    throw new Error(`Unexpected table: ${table}`)
  }

  return { from, _upsertCalls: upsertCalls }
}

function buildChain(response, { terminal }) {
  const api = {
    select: () => api,
    eq: () => api,
    order: () => api,
    limit: (() => {
      if (terminal === 'limit') {
        return async () => response
      }
      return () => api
    })(),
    maybeSingle: terminal === 'maybeSingle' ? async () => response : () => api,
  }
  return api
}

function makeOpenai(payload) {
  return {
    chat: {
      completions: {
        create: async () => ({
          choices: [{ message: { content: typeof payload === 'string' ? payload : JSON.stringify(payload) } }],
        }),
      },
    },
  }
}

test('happy path: upserts a cv version with pain interpretation and 5-8 tailored bullets', async () => {
  const supabase = makeSupabase({})
  const openai = makeOpenai(makeValidLlmPayload({ count: 7 }))

  const result = await generateTailoredCv({
    userId: 'user-1',
    briefId: 'brief-1',
    supabase,
    openai,
  })

  assert.ok(result, 'result should be returned')
  assert.equal(supabase._upsertCalls.length, 1)
  const call = supabase._upsertCalls[0]
  assert.equal(call.opts.onConflict, 'brief_id')
  assert.equal(call.row.brief_id, 'brief-1')
  assert.equal(call.row.user_id, 'user-1')
  assert.equal(call.row.master_resume_id, 'resume-1')
  assert.ok(typeof call.row.profile_summary_tailored === 'string' && call.row.profile_summary_tailored.length > 0)
  assert.equal(call.row.bullets_tailored.length, 7)
  assert.ok(call.row.bullets_tailored.every((b) => typeof b.pain_hook === 'string' && b.pain_hook.length > 0))
  assert.ok(typeof call.row.pain_interpretation === 'string' && call.row.pain_interpretation.length > 0)
  assert.equal(call.row.gaps, null)
  assert.equal(call.row.rejected_bullets.length, 1)
  assert.equal(call.row.rejected_bullets[0].original_index, 15)
  assert.equal(call.row.positioning_angle_used, BRIEF_ROW.snapshot_neutral.positioning_angle)
  assert.equal(call.row.what_they_seek_used, BRIEF_ROW.snapshot_neutral.what_they_seek)
  assert.equal(call.row.top_role_title_used, 'VP RevOps')
  assert.equal(call.row.generation_model, 'gpt-4o-mini')
  assert.ok(call.row.generation_prompt.includes('DOLOR DIAGNOSTICADO'))
})

test('accepts 5 bullets (minimum) when gaps explain the shortfall', async () => {
  const supabase = makeSupabase({})
  const openai = makeOpenai({
    ...makeValidLlmPayload({ count: 5 }),
    gaps: 'Missing supply chain proof points; only generic ops material available.',
  })
  await generateTailoredCv({ userId: 'user-1', briefId: 'brief-1', supabase, openai })
  const row = supabase._upsertCalls[0].row
  assert.equal(row.bullets_tailored.length, 5)
  assert.equal(row.gaps, 'Missing supply chain proof points; only generic ops material available.')
})

test('tailored bullets include original_text when original_index is valid', async () => {
  const supabase = makeSupabase({})
  const openai = makeOpenai(makeValidLlmPayload({ count: 6 }))

  await generateTailoredCv({ userId: 'user-1', briefId: 'brief-1', supabase, openai })
  const bullets = supabase._upsertCalls[0].row.bullets_tailored
  assert.equal(bullets[0].original_index, 0)
  assert.equal(bullets[0].original_text, 'Accomplishment #0')
  assert.equal(bullets[0].tailored_text, 'Tailored bullet 0')
  assert.equal(bullets[0].pain_hook, 'Proves fix for forecast gap 0')
})

test('throws NO_MASTER_RESUME when user has no master resume', async () => {
  const supabase = makeSupabase({ masterResumeResponse: { data: [], error: null } })
  const openai = makeOpenai(makeValidLlmPayload())

  await assert.rejects(
    () => generateTailoredCv({ userId: 'user-1', briefId: 'brief-1', supabase, openai }),
    (err) => err instanceof CvPersonalizationError && err.code === 'NO_MASTER_RESUME',
  )
})

test('throws BRIEF_NOT_FOUND when the brief does not belong to user', async () => {
  const supabase = makeSupabase({ briefResponse: { data: null, error: null } })
  const openai = makeOpenai(makeValidLlmPayload())

  await assert.rejects(
    () => generateTailoredCv({ userId: 'user-1', briefId: 'brief-1', supabase, openai }),
    (err) => err instanceof CvPersonalizationError && err.code === 'BRIEF_NOT_FOUND',
  )
})

test('throws LLM_BAD_OUTPUT when the LLM returns fewer than 5 bullets', async () => {
  const supabase = makeSupabase({})
  const openai = makeOpenai(makeValidLlmPayload({ count: 4 }))

  await assert.rejects(
    () => generateTailoredCv({ userId: 'user-1', briefId: 'brief-1', supabase, openai }),
    (err) => err instanceof CvPersonalizationError && err.code === 'LLM_BAD_OUTPUT',
  )
})

test('throws LLM_BAD_OUTPUT when the LLM returns more than 8 bullets', async () => {
  const supabase = makeSupabase({})
  const openai = makeOpenai(makeValidLlmPayload({ count: 9 }))

  await assert.rejects(
    () => generateTailoredCv({ userId: 'user-1', briefId: 'brief-1', supabase, openai }),
    (err) => err instanceof CvPersonalizationError && err.code === 'LLM_BAD_OUTPUT',
  )
})

test('throws LLM_BAD_OUTPUT when the LLM response is not valid JSON', async () => {
  const supabase = makeSupabase({})
  const openai = makeOpenai('not json at all {{{')

  await assert.rejects(
    () => generateTailoredCv({ userId: 'user-1', briefId: 'brief-1', supabase, openai }),
    (err) => err instanceof CvPersonalizationError && err.code === 'LLM_BAD_OUTPUT',
  )
})

test('throws LLM_BAD_OUTPUT when a bullet is missing tailored_text', async () => {
  const supabase = makeSupabase({})
  const bad = makeValidLlmPayload({ count: 7 })
  bad.bullets_tailored[0] = { original_index: 0, pain_hook: 'X' }
  const openai = makeOpenai(bad)

  await assert.rejects(
    () => generateTailoredCv({ userId: 'user-1', briefId: 'brief-1', supabase, openai }),
    (err) => err instanceof CvPersonalizationError && err.code === 'LLM_BAD_OUTPUT',
  )
})

test('throws LLM_BAD_OUTPUT when a bullet is missing pain_hook', async () => {
  const supabase = makeSupabase({})
  const bad = makeValidLlmPayload({ count: 7 })
  bad.bullets_tailored[2] = { original_index: 2, tailored_text: 'Has text but no hook' }
  const openai = makeOpenai(bad)

  await assert.rejects(
    () => generateTailoredCv({ userId: 'user-1', briefId: 'brief-1', supabase, openai }),
    (err) => err instanceof CvPersonalizationError && err.code === 'LLM_BAD_OUTPUT',
  )
})

test('throws LLM_BAD_OUTPUT when pain_interpretation is missing', async () => {
  const supabase = makeSupabase({})
  const bad = makeValidLlmPayload({ count: 7 })
  delete bad.pain_interpretation
  const openai = makeOpenai(bad)

  await assert.rejects(
    () => generateTailoredCv({ userId: 'user-1', briefId: 'brief-1', supabase, openai }),
    (err) => err instanceof CvPersonalizationError && err.code === 'LLM_BAD_OUTPUT',
  )
})

test('defaults target language to English when none is provided', async () => {
  const supabase = makeSupabase({})
  const captured = []
  const openai = {
    chat: {
      completions: {
        create: async (args) => {
          captured.push(args)
          return { choices: [{ message: { content: JSON.stringify(makeValidLlmPayload()) } }] }
        },
      },
    },
  }

  await generateTailoredCv({ userId: 'user-1', briefId: 'brief-1', supabase, openai })
  const systemContent = captured[0].messages.find((m) => m.role === 'system').content
  assert.ok(systemContent.includes('IDIOMA DE SALIDA OBLIGATORIO: English'))
})

test('passes Spanish to the prompt when language="es"', async () => {
  const supabase = makeSupabase({})
  const captured = []
  const openai = {
    chat: {
      completions: {
        create: async (args) => {
          captured.push(args)
          return { choices: [{ message: { content: JSON.stringify(makeValidLlmPayload()) } }] }
        },
      },
    },
  }

  await generateTailoredCv({ userId: 'user-1', briefId: 'brief-1', supabase, openai, language: 'es' })
  const systemContent = captured[0].messages.find((m) => m.role === 'system').content
  assert.ok(systemContent.includes('IDIOMA DE SALIDA OBLIGATORIO: Spanish'))
  const userContent = captured[0].messages.find((m) => m.role === 'user').content
  assert.ok(userContent.includes('en Spanish'))
})

test('falls back to English for an unknown language code', async () => {
  const supabase = makeSupabase({})
  const captured = []
  const openai = {
    chat: {
      completions: {
        create: async (args) => {
          captured.push(args)
          return { choices: [{ message: { content: JSON.stringify(makeValidLlmPayload()) } }] }
        },
      },
    },
  }

  await generateTailoredCv({ userId: 'user-1', briefId: 'brief-1', supabase, openai, language: 'zz' })
  const systemContent = captured[0].messages.find((m) => m.role === 'system').content
  assert.ok(systemContent.includes('IDIOMA DE SALIDA OBLIGATORIO: English'))
})

test('throws OPENAI_FAILED when the OpenAI call itself rejects', async () => {
  const supabase = makeSupabase({})
  const openai = {
    chat: {
      completions: {
        create: async () => {
          throw new Error('upstream down')
        },
      },
    },
  }

  await assert.rejects(
    () => generateTailoredCv({ userId: 'user-1', briefId: 'brief-1', supabase, openai }),
    (err) => err instanceof CvPersonalizationError && err.code === 'OPENAI_FAILED' && err.status === 502,
  )
})
