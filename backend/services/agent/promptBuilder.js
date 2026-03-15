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

  return `You are Bruno, the AI career coaching assistant for NovaWork Global, a professional career coaching and resume creation platform.

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

LANGUAGE RULE (CRITICAL — follow exactly):
- Your DEFAULT language is English unless instructed otherwise.
- If the user's profile preferred_language is set, use that as your default.
- If the user sends a message clearly written in a different language than the default, switch to that language for your response.
- If the user writes in Spanish → respond in Spanish. If English → respond in English.
- NEVER respond in a language the user did not write in or choose.
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
// Helper: safely render a value that might be a string, array, or JSON object
function safe(val) {
  if (val === null || val === undefined) return 'N/A';
  if (typeof val === 'string') return val || 'N/A';
  if (Array.isArray(val)) return val.length ? val.join(', ') : 'N/A';
  if (typeof val === 'object') return JSON.stringify(val, null, 2);
  return String(val);
}

export function buildContentSection(context) {
  const hasProfileContent = context.career_vision || context.positioning
    || context.professional_profile || context.onboarding;
  const hasReviewContent = context.car_stories?.length || context.accomplishments?.length;
  const hasOtherContent = context.coach_client_summary || context.support_signals?.length;

  if (!hasProfileContent && !hasReviewContent && !hasOtherContent) return '';

  let content = '\nRETRIEVED CONTENT (use ONLY this data — do not invent or fill in blanks):\n';
  content += 'IMPORTANT: Present ALL available data to the user. Even if some fields are empty, describe what IS available in detail.\n';

  // --- Career Vision Profile ---
  if (context.career_vision) {
    const cv = context.career_vision;
    content += `
CAREER VISION PROFILE (from database):
Career Vision Statement: ${safe(cv.career_vision_statement)}
Core Values: ${safe(cv.core_values)}
Skills & Knowledge: ${safe(cv.skills_knowledge)}
Interests: ${safe(cv.interests)}
Job History Insights: ${safe(cv.job_history_insights)}
---`;
  }

  // --- Positioning Questionnaire ---
  if (context.positioning) {
    const pq = context.positioning;
    content += `
POSITIONING QUESTIONNAIRE (from database):
Current Title: ${safe(pq.identity_current_title)}
Target Title: ${safe(pq.identity_target_title)}
One-Phrase Identity: ${safe(pq.identity_one_phrase)}
Years Experience: ${safe(pq.years_experience_bucket)}
Industries: ${safe(pq.industries)}
Functions: ${safe(pq.functions)}
Trusted Problems Solved: ${safe(pq.trusted_problems)}
Strengths: ${safe(pq.strengths)}
Differentiator: ${safe(pq.differentiator)}
Colleagues Describe Me As: ${safe(pq.colleagues_describe)}
Technical Skills & Tools: ${safe(pq.technical_skills_tools)}
Certifications: ${safe(pq.certifications_advanced_training)}
Methodologies: ${safe(pq.methodologies)}
Languages Spoken: ${safe(pq.languages_spoken)}
Core Mandate: ${[pq.core_mandate_verb, pq.core_mandate_objective].filter(Boolean).join(' ') || 'N/A'}
Team Size: ${safe(pq.lead_direct_reports)} direct / ${safe(pq.lead_total_team)} total
Revenue Impact: ${safe(pq.fin_revenue_impact)} | Annual Spend: ${safe(pq.fin_annual_spend)}
---`;
  }

  // --- Generated Professional Profile ---
  if (context.professional_profile) {
    const pp = context.professional_profile;
    content += `
AI-GENERATED PROFESSIONAL PROFILE (version ${safe(pp.version)}):
Identity Sentence: ${safe(pp.output_identity_sentence)}
Blended Value Sentence: ${safe(pp.output_blended_value_sentence)}
Competency Paragraph: ${safe(pp.output_competency_paragraph)}
Areas of Excellence: ${safe(pp.output_areas_of_excellence)}
Skills Section: ${safe(pp.output_skills_section)}
---`;
  }

  // --- Onboarding Responses ---
  if (context.onboarding) {
    const ob = context.onboarding;
    content += `
ONBOARDING RESPONSES (from database):
Current Situation: ${safe(ob.current_situation)}
Top Priority: ${safe(ob.top_priority)}
Target Job Title: ${safe(ob.target_job_title)}
Skills: ${safe(ob.skills)}
Interests: ${safe(ob.interests)}
Values: ${safe(ob.values)}
Values Reasoning: ${safe(ob.values_reasoning)}
---`;
  }

  if (hasReviewContent) {
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
