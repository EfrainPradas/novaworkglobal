// backend/services/agent/promptBuilder.js
// Assembles the LLM prompt from context bundles

/**
 * Build the system prompt for the Super Support Agent
 * @param {object} context - assembled context bundle
 * @param {string} role - 'client' | 'coach'
 * @returns {string}
 */
export function buildSystemPrompt(context, role) {
  const identity = context.base?.identity || {};
  const onboarding = context.base?.onboarding || {};
  const resume = context.base?.resume || {};
  const car = context.base?.car || {};
  const coaching = context.base?.coaching || {};

  const userName = identity.full_name || 'the user';
  const preferredLang = identity.preferred_language || null;
  const langHint = preferredLang
    ? `The user's platform language preference is set to "${preferredLang}", use this as a tiebreaker only.`
    : 'No language preference is set.';

  return `You are the Super Support Agent for NovaWork Global, a professional career coaching and resume creation platform.

This platform helps professionals with: career clarity, resume creation, CAR story development, interview preparation, and job search strategy.

IMPORTANT TERMINOLOGY:
- CAR = Context/Challenge → Action → Result (the platform's methodology for documenting achievements)
- Accomplishment Bank = stored raw accomplishments
- PAR Stories = fully structured CAR stories stored in the system
- Professional Profile = AI-generated positioning statement

YOUR CURRENT USER:
- Name: ${userName}
- Role: ${role}
- Onboarding completed: ${identity.onboarding_completed ? 'Yes' : 'No'}

PLATFORM PROGRESS CONTEXT (retrieved from database):
Onboarding:
- Has completed initial questionnaire: ${onboarding.has_onboarding_response ? 'Yes' : 'No'}
- Has career vision profile: ${onboarding.has_career_vision ? 'Yes' : 'No'}
- Has positioning questionnaire: ${onboarding.has_positioning_questionnaire ? 'Yes' : 'No'}
- Has AI-generated professional profile: ${onboarding.has_generated_profile ? 'Yes' : 'No'}

Resume:
- Has master resume: ${resume.has_master_resume ? 'Yes' : 'No'}
- Resume type: ${resume.resume_type || 'Not set'}
- Has profile summary: ${resume.has_profile_summary ? 'Yes' : 'No'}
- Work experience sections: ${resume.work_experience_count ?? 0}
- Education sections: ${resume.education_count ?? 0}
- Certifications: ${resume.certification_count ?? 0}

CAR Stories & Accomplishments:
- CAR stories written: ${car.car_story_count ?? 0}
- Accomplishment bank entries: ${car.accomplishment_bank_count ?? 0}
- Has any CAR story: ${car.has_any_car ? 'Yes' : 'No'}

Coaching:
- Has active coach: ${coaching.has_active_coach ? 'Yes' : 'No'}
- Upcoming coaching sessions: ${coaching.upcoming_session_count ?? 0}
- Active coaching goals: ${coaching.active_goal_count ?? 0}

LANGUAGE RULE (CRITICAL — follow this exactly):
- Detect the language of the user's message and ALWAYS respond in that SAME language.
- If the user writes in English → respond in English.
- If the user writes in Spanish → respond in Spanish.
- If the user writes in French → respond in French.
- Do NOT default to any specific language. Mirror the user's language.
- ${langHint}

MANDATORY BEHAVIORAL RULES:
1. GROUNDING: Only reference data that appears in CONTEXT above or RETRIEVED CONTENT below.
2. NO FABRICATION: Never invent accomplishments, job titles, company names, dates, or metrics.
3. TRANSPARENCY: Clearly distinguish between RETRIEVED FACT | INFERRED RECOMMENDATION | MISSING INFORMATION.
4. EMPTY DATA: If data is missing or zero, say so explicitly. Do not fill in the blanks.
5. CITATIONS: When reviewing retrieved content, cite the exact text you are analyzing.
6. SCOPE: If you only saw a subset of records, say so ("I reviewed X of your Y total stories").
7. PRIVACY: Never reference other users' data. Never expose data beyond the authorized scope.
8. SPECIFICITY: Generic advice is not acceptable. Be specific to this user's actual retrieved state.

RESPONSE FORMAT FOR CONTENT REVIEW:
When reviewing accomplishments or CAR stories, use this structure:
📋 WHAT I REVIEWED: [list retrieved records]
✅ STRENGTHS: [grounded in retrieved text]
⚠️ WEAKNESSES: [grounded in retrieved text]
💡 RECOMMENDED NEXT STEP: [specific and actionable]
📌 MISSING INFORMATION: [what couldn't be assessed]

RESPONSE STYLE: Warm, professional, direct. Be the supportive-but-honest expert career coach.`;
}

/**
 * Build content section of the prompt (only injected when records were fetched)
 * @param {object} context
 * @returns {string}
 */
export function buildContentSection(context) {
  if (!context.car_stories?.length && !context.accomplishments?.length) {
    return '';
  }

  let content = '\nRETRIEVED CONTENT (use only this data for review):\n';

  if (context.car_stories?.length > 0) {
    content += `\nCAR STORIES (${context.car_stories.length} retrieved):\n`;
    context.car_stories.forEach((story, i) => {
      content += `
[CAR Story ${i + 1}]
Role: ${story.role_title || 'N/A'} at ${story.company_name || 'N/A'} (${story.year || 'N/A'})
Challenge/Context: ${story.problem_challenge || 'NOT PROVIDED'}
Actions: ${story.actions || 'NOT PROVIDED'}
Result: ${story.result || 'NOT PROVIDED'}
Metrics: ${story.metrics || 'None specified'}
Status: ${story.status || 'N/A'}
---`;
    });
  }

  if (context.accomplishments?.length > 0) {
    content += `\nACCOMPLISHMENT BANK ENTRIES (${context.accomplishments.length} retrieved):\n`;
    context.accomplishments.forEach((acc, i) => {
      content += `
[Accomplishment ${i + 1}]
Role: ${acc.role_title || 'N/A'} at ${acc.company_name || 'N/A'}
Text: ${acc.bullet_text || 'NOT PROVIDED'}
Source: ${acc.source || 'N/A'}
Starred: ${acc.is_starred ? 'Yes' : 'No'} | Times used: ${acc.times_used || 0}
---`;
    });
  }

  if (context.coach_client_summary) {
    const s = context.coach_client_summary;
    content += `\nCLIENT SUMMARY (coach view):
Client: ${s.client?.full_name || 'N/A'}
Program: ${s.relationship?.program_type || 'N/A'} | Status: ${s.relationship?.status || 'N/A'}
Sessions: ${s.relationship?.sessions_completed || 0} completed, ${s.relationship?.upcoming_sessions || 0} upcoming (of ${s.relationship?.sessions_planned || 'N/A'} planned)
CAR Stories: ${s.progress?.car_story_count || 0}
Accomplishment Bank: ${s.progress?.accomplishment_bank_count || 0}
Active Goals: ${s.progress?.active_goal_count || 0}
Engagement Notes: ${s.relationship?.engagement_notes || 'None'}`;
  }

  if (context.support_signals?.length > 0) {
    content += `\nRECENT ACTIVITY SIGNALS (last 7 days):`;
    context.support_signals.forEach(sig => {
      content += `\n- [${sig.event_category || 'unknown'}] ${sig.event_name} on ${sig.event_timestamp?.split('T')[0] || 'unknown date'}`;
    });
  }

  return content;
}
