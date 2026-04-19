/**
 * CV Personalization — tailors a user's master resume to attack a specific
 * diagnosed corporate pain from a Smart Match brief.
 *
 * Consumes only neutral vocabulary emitted by smartMatchTranslator.
 * Never mutates the master resume — the output lives in smart_match_cv_versions.
 *
 * The prompt is structured as SYSTEM (hard rules) + USER (the case):
 *   - SYSTEM forbids generic bullets, requires a pain_hook per bullet, and
 *     treats positioning_angle as the attack mission (not a suggestion).
 *   - USER feeds match_insight / relevant_area / what_they_seek / positioning_angle
 *     as the diagnosed pain surface the candidate must prove they resolve.
 * Temperature 0.2 keeps output tight and aligned with the rules.
 */

const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_TEMPERATURE = 0.2
const MIN_BULLET_COUNT = 5
const MAX_BULLET_COUNT = 8

const LANG_MAP = { en: 'English', es: 'Spanish', pt: 'Portuguese', fr: 'French', it: 'Italian' }

export class CvPersonalizationError extends Error {
  constructor(code, message, options = {}) {
    super(message || code)
    this.code = code
    if (options.status) this.status = options.status
    if (options.cause) this.cause = options.cause
  }
}

export async function generateTailoredCv({ userId, briefId, supabase, openai, model = DEFAULT_MODEL, language = 'en' }) {
  if (!userId) throw new CvPersonalizationError('MISSING_USER_ID')
  if (!briefId) throw new CvPersonalizationError('MISSING_BRIEF_ID')
  if (!supabase) throw new CvPersonalizationError('MISSING_SUPABASE')
  if (!openai) throw new CvPersonalizationError('MISSING_OPENAI')

  const langCode = (language || 'en').toString().slice(0, 2).toLowerCase()
  const targetLanguage = LANG_MAP[langCode] || 'English'

  const { data: brief, error: briefError } = await supabase
    .from('smart_match_briefs')
    .select('id, user_id, domain, snapshot_neutral')
    .eq('id', briefId)
    .eq('user_id', userId)
    .maybeSingle()

  if (briefError) {
    throw new CvPersonalizationError('BRIEF_LOOKUP_FAILED', briefError.message, { cause: briefError })
  }
  if (!brief) throw new CvPersonalizationError('BRIEF_NOT_FOUND')

  const snapshot = brief.snapshot_neutral || {}
  const positioning_angle = snapshot.positioning_angle || null
  const what_they_seek = snapshot.what_they_seek || null
  const match_insight = snapshot.match_insight || null
  const relevant_area = snapshot.relevant_area || null
  const inferred_sector = snapshot.inferred_sector || null
  const openRoles = Array.isArray(snapshot.open_roles) ? snapshot.open_roles : []
  const top_role_title = openRoles[0]?.title || null

  const { data: masterResumes, error: resumeError } = await supabase
    .from('user_resumes')
    .select('id, profile_summary, updated_at')
    .eq('user_id', userId)
    .eq('is_master', true)
    .order('updated_at', { ascending: false })
    .limit(1)

  if (resumeError) {
    throw new CvPersonalizationError('RESUME_LOOKUP_FAILED', resumeError.message, { cause: resumeError })
  }

  const masterResume = masterResumes?.[0]
  if (!masterResume) throw new CvPersonalizationError('NO_MASTER_RESUME')

  const profile_summary = (masterResume.profile_summary || '').trim()

  const { data: bulletRows, error: bulletsError } = await supabase
    .from('accomplishment_bank')
    .select('bullet_text')
    .eq('user_id', userId)
    .limit(40)

  if (bulletsError) {
    throw new CvPersonalizationError('BULLETS_LOOKUP_FAILED', bulletsError.message, { cause: bulletsError })
  }

  const bullets = (bulletRows || [])
    .map((b) => (b.bullet_text || '').trim())
    .filter(Boolean)

  if (bullets.length === 0 && !profile_summary) {
    throw new CvPersonalizationError('EMPTY_RESUME_SOURCE')
  }

  const { system, user } = buildPrompt({
    domain: brief.domain,
    inferred_sector,
    match_insight,
    relevant_area,
    what_they_seek,
    positioning_angle,
    top_role_title,
    profile_summary,
    bullets,
    targetLanguage,
  })

  let completion
  try {
    completion = await openai.chat.completions.create({
      model,
      temperature: DEFAULT_TEMPERATURE,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    })
  } catch (err) {
    throw new CvPersonalizationError('OPENAI_FAILED', err?.message || 'OpenAI request failed', {
      status: 502,
      cause: err,
    })
  }

  const raw = completion?.choices?.[0]?.message?.content
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    throw new CvPersonalizationError('LLM_BAD_OUTPUT', 'Response was not valid JSON', { cause: err })
  }

  const validated = validateLlmOutput(parsed, bullets)

  const row = {
    brief_id: briefId,
    user_id: userId,
    master_resume_id: masterResume.id,
    profile_summary_tailored: validated.profile_summary_tailored,
    bullets_tailored: validated.bullets_tailored,
    pain_interpretation: validated.pain_interpretation,
    gaps: validated.gaps,
    rejected_bullets: validated.rejected_bullets,
    positioning_angle_used: positioning_angle,
    what_they_seek_used: what_they_seek,
    top_role_title_used: top_role_title,
    generation_prompt: `${system}\n\n---\n\n${user}`,
    generation_model: model,
  }

  const { data: upserted, error: upsertError } = await supabase
    .from('smart_match_cv_versions')
    .upsert(row, { onConflict: 'brief_id' })
    .select()
    .single()

  if (upsertError) {
    throw new CvPersonalizationError('UPSERT_FAILED', upsertError.message, { cause: upsertError })
  }

  return upserted
}

function validateLlmOutput(parsed, sourceBullets) {
  if (!parsed || typeof parsed !== 'object') {
    throw new CvPersonalizationError('LLM_BAD_OUTPUT', 'Response is not an object')
  }

  const painInterpretation = typeof parsed.pain_interpretation === 'string'
    ? parsed.pain_interpretation.trim()
    : ''
  if (!painInterpretation) {
    throw new CvPersonalizationError('LLM_BAD_OUTPUT', 'Missing pain_interpretation')
  }

  const summary = typeof parsed.profile_summary_tailored === 'string'
    ? parsed.profile_summary_tailored.trim()
    : ''
  if (!summary) {
    throw new CvPersonalizationError('LLM_BAD_OUTPUT', 'Missing profile_summary_tailored')
  }

  const list = Array.isArray(parsed.bullets_tailored) ? parsed.bullets_tailored : []
  if (list.length < MIN_BULLET_COUNT || list.length > MAX_BULLET_COUNT) {
    throw new CvPersonalizationError(
      'LLM_BAD_OUTPUT',
      `Expected ${MIN_BULLET_COUNT}-${MAX_BULLET_COUNT} bullets, got ${list.length}`,
    )
  }

  const normalizedBullets = list.map((item, idx) => {
    if (!item || typeof item !== 'object') {
      throw new CvPersonalizationError('LLM_BAD_OUTPUT', `Bullet ${idx} is not an object`)
    }
    const text = typeof item.tailored_text === 'string' ? item.tailored_text.trim() : ''
    if (!text) {
      throw new CvPersonalizationError('LLM_BAD_OUTPUT', `Bullet ${idx} is missing tailored_text`)
    }
    const painHook = typeof item.pain_hook === 'string' ? item.pain_hook.trim() : ''
    if (!painHook) {
      throw new CvPersonalizationError('LLM_BAD_OUTPUT', `Bullet ${idx} is missing pain_hook`)
    }
    const rawIndex = item.original_index
    const originalIndex = Number.isFinite(Number(rawIndex)) ? Number(rawIndex) : null
    const originalText = originalIndex != null && sourceBullets[originalIndex]
      ? sourceBullets[originalIndex]
      : null
    return {
      original_index: originalIndex,
      original_text: originalText,
      tailored_text: text,
      pain_hook: painHook,
    }
  })

  const gapsRaw = parsed.gaps
  let gaps = null
  if (typeof gapsRaw === 'string') {
    const trimmed = gapsRaw.trim()
    gaps = trimmed ? trimmed : null
  }

  const rejectedRaw = Array.isArray(parsed.rejected_bullets) ? parsed.rejected_bullets : []
  const rejectedBullets = rejectedRaw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const rawIdx = item.original_index
      const origIdx = Number.isFinite(Number(rawIdx)) ? Number(rawIdx) : null
      const reason = typeof item.reason === 'string' ? item.reason.trim() : ''
      if (origIdx == null || !reason) return null
      return { original_index: origIdx, reason }
    })
    .filter(Boolean)

  return {
    pain_interpretation: painInterpretation,
    profile_summary_tailored: summary,
    bullets_tailored: normalizedBullets,
    gaps,
    rejected_bullets: rejectedBullets,
  }
}

function buildPrompt({
  domain,
  inferred_sector,
  match_insight,
  relevant_area,
  what_they_seek,
  positioning_angle,
  top_role_title,
  profile_summary,
  bullets,
  targetLanguage,
}) {
  const bullets_enumerated = bullets.map((b, i) => `${i}. ${b}`).join('\n') || '(no bullets available)'
  const lang = targetLanguage || 'English'

  const system = `Eres un estratega de posicionamiento ejecutivo. Tu único objetivo es reescribir un CV para que ataque un dolor corporativo específico ya diagnosticado. No haces CVs genéricos. No suavizas. Si un bullet no ataca el dolor, lo descartas aunque sea impresionante.

IDIOMA DE SALIDA OBLIGATORIO: ${lang}.
- TODAS las cadenas visibles al usuario (profile_summary_tailored, tailored_text, pain_hook, pain_interpretation, gaps, rejected_bullets.reason) deben escribirse en ${lang}.
- Las claves JSON se mantienen en inglés tal como están en el contrato de salida.
- No mezcles idiomas dentro de una misma cadena.

REGLAS INNEGOCIABLES:
1. El profile_summary debe NOMBRAR el dolor en lenguaje de negocio (no usar palabras técnicas internas como "friction" o "pain"). Debe decir explícitamente qué problema resuelve este candidato para esta empresa.
2. Cada bullet elegido debe tener un "pain_hook": una frase de máx 10 palabras que explique por qué ESE bullet prueba que el candidato resuelve ESE dolor. Si no puedes escribir el pain_hook sin inventarlo, descarta el bullet.
3. Prohibido: bullets genéricos tipo "led cross-functional teams", "drove strategic initiatives", "results-oriented leader". Si el bullet no tiene un número, una palanca concreta, o un mecanismo, no entra.
4. Los bullets deben estar ordenados por qué tan directamente atacan el dolor — el #1 es el más letal, el último es relleno contextual.
5. Si el banco de bullets no tiene material suficiente para atacar el dolor honestamente, devuelve menos de 8 bullets y explica qué falta en "gaps". Mejor un CV corto y quirúrgico que uno largo y tibio.`

  const user = `EMPRESA: ${domain || '(unknown)'}
SECTOR: ${inferred_sector || 'n/a'}

═══ DOLOR DIAGNOSTICADO (esto es lo que hay que atacar) ═══
QUÉ LES DUELE:
${match_insight || '(not provided)'}

DÓNDE VIVE EL DOLOR (área funcional):
${relevant_area || '(not provided)'}

QUÉ NECESITAN (capacidad concreta que están buscando):
${what_they_seek || '(not provided)'}

ÁNGULO DE POSICIONAMIENTO (cómo debe posicionarse el candidato frente a ellos):
${positioning_angle || '(not provided)'}

ROL OBJETIVO: ${top_role_title || 'no especificado'}

═══ MATERIAL DISPONIBLE DEL CANDIDATO ═══
PROFILE SUMMARY ACTUAL (solo para contexto, reescríbelo desde cero):
${profile_summary || '(empty)'}

BANCO DE BULLETS (elige y reescribe los más letales):
${bullets_enumerated}

═══ TU OUTPUT ═══
Responde JSON estricto con este shape exacto:
{
  "pain_interpretation": "Una oración de máx 25 palabras explicando cómo ENTENDISTE el dolor. Esto es tu tesis de ataque.",
  "profile_summary_tailored": "2-3 oraciones, máx 80 palabras. DEBE empezar reconociendo el tipo de problema que resuelve el candidato, conectar con el sector/escala de la empresa, y terminar con una capacidad específica que matchee what_they_seek. Sin buzzwords.",
  "bullets_tailored": [
    {
      "original_index": 3,
      "tailored_text": "Bullet reescrito — debe tener número, mecanismo y resultado. Máx 30 palabras.",
      "pain_hook": "Por qué este bullet prueba que resuelve el dolor — máx 10 palabras."
    }
  ],
  "gaps": "Si faltan proof points críticos para este dolor, dilo aquí. Si no faltan, null.",
  "rejected_bullets": [
    {"original_index": 7, "reason": "Demasiado genérico, no mapea al dolor de supply chain."}
  ]
}

Quiero entre ${MIN_BULLET_COUNT} y ${MAX_BULLET_COUNT} bullets. No rellenes para llegar a ${MAX_BULLET_COUNT} si el banco no da.

RECORDATORIO: escribe todas las cadenas visibles (profile_summary_tailored, tailored_text, pain_hook, pain_interpretation, gaps, rejected_bullets.reason) en ${lang}, sin mezclar idiomas.`

  return { system, user }
}
