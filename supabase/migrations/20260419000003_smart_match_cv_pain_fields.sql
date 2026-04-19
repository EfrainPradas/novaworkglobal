-- Smart Match CV versions — pain-attack columns.
--
-- Adds the fields captured by the sharper "dolor corporativo" prompt:
--   pain_interpretation: the LLM's thesis-of-attack (<=25 words)
--   gaps: what's missing in the bullet bank to fully attack the pain (nullable)
--   rejected_bullets: bullets the LLM explicitly discarded with reasons

ALTER TABLE smart_match_cv_versions
  ADD COLUMN IF NOT EXISTS pain_interpretation TEXT,
  ADD COLUMN IF NOT EXISTS gaps TEXT,
  ADD COLUMN IF NOT EXISTS rejected_bullets JSONB DEFAULT '[]'::jsonb;
