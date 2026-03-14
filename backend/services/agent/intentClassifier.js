// backend/services/agent/intentClassifier.js
// Rule-based intent classification — Phase 1 MVP

const INTENT_PATTERNS = [
  // CAR methodology
  { intent: 'car_explanation',        patterns: ['what is car', 'what is par', 'explain car', 'explain par', 'car methodology', 'context action result'] },
  { intent: 'car_creation_guidance',  patterns: ['help me write a car', 'create a car story', 'new car story', 'write a story', 'help me create'] },
  { intent: 'car_critique_single',    patterns: ['review this car', 'review my story', 'critique this', 'give me feedback on this', 'is this car good'] },
  { intent: 'car_critique_portfolio', patterns: ['review my cars', 'review all my stories', 'review my accomplishments', 'review my top', 'portfolio review'] },
  { intent: 'car_rewrite_request',    patterns: ['rewrite this', 'improve this car', 'make this better', 'stronger version'] },
  { intent: 'accomplishment_to_car',  patterns: ['turn this into a car', 'convert this to a car', 'make a car from', 'expand this into'] },

  // Content review
  { intent: 'identify_best_for_interview', patterns: ['best for interview', 'strongest for interview', 'which story for interview', 'pick for interview'] },
  { intent: 'identify_best_for_resume',    patterns: ['best for resume', 'strongest for resume', 'which bullet for resume'] },
  { intent: 'identify_best_for_linkedin',  patterns: ['best for linkedin', 'strongest for linkedin'] },
  { intent: 'compare_stories',             patterns: ['compare these', 'compare my stories', 'which is stronger', 'compare these stories'] },

  // Resume
  { intent: 'resume_section_help',    patterns: ['resume section', 'work experience section', 'education section', 'what to put in my resume', 'help with resume'] },
  { intent: 'profile_summary_help',   patterns: ['professional summary', 'profile summary', 'professional profile', 'write my summary'] },
  { intent: 'resume_format_guidance', patterns: ['resume format', 'chronological', 'functional resume'] },

  // Interview
  { intent: 'interview_strategy',     patterns: ['interview', 'prepare for interview', 'interview prep', 'upcoming interview', 'interview question'] },
  { intent: 'jd_alignment_check',     patterns: ['job description', 'match my experience', 'jd alignment', 'compare to job'] },

  // Job search
  { intent: 'job_search_next_steps',  patterns: ['job search', 'find a job', 'apply to jobs', 'what should i do next', 'next step in job search'] },
  { intent: 'networking_strategy',    patterns: ['networking', 'network', 'reach out to', 'linkedin connection'] },

  // Navigation / onboarding
  { intent: 'onboarding_help',        patterns: ['where do i start', 'how do i begin', 'getting started', 'first step', 'new here', 'just joined'] },
  { intent: 'module_navigation',      patterns: ['how do i use', 'how does this work', 'where is', 'how to find', 'navigate to', 'where can i'] },
  { intent: 'workflow_recovery',      patterns: ['stuck', 'confused', 'lost', "don't know what to do", 'not sure where', 'help me get back'] },

  // Next best action
  { intent: 'suggest_next_best_action', patterns: ['what should i do', 'what next', 'next best step', 'what do you recommend', 'what should i focus on'] },

  // Coaching (coach role)
  { intent: 'client_summary_request',    patterns: ['summarize this client', 'client summary', 'tell me about this client', 'client progress'] },
  { intent: 'client_bottleneck_detection', patterns: ['what are their blockers', 'where are they stuck', 'why is client stuck'] },
  { intent: 'session_preparation_help',  patterns: ['prepare for session', 'session prep', 'upcoming session', 'what to discuss'] },

  // Motivational
  { intent: 'motivational_support',   patterns: ['i feel overwhelmed', 'this is hard', 'feeling stuck', 'discouraged', 'not making progress'] },

  // Escalation
  { intent: 'escalation_needed',      patterns: ['talk to a human', 'speak to support', 'contact support', 'real person', 'escalate'] },
  { intent: 'possible_bug',           patterns: ['bug', 'not working', 'error', 'broken', 'something wrong', 'data is missing', 'disappeared'] },
];

/**
 * Classify intent from user message (rule-based, returns top match)
 * @param {string} message
 * @returns {string} intent
 */
export function classifyIntent(message) {
  const lower = message.toLowerCase();

  for (const { intent, patterns } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (lower.includes(pattern)) {
        return intent;
      }
    }
  }

  return 'general_help'; // fallback
}
