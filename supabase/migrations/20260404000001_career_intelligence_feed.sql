-- ============================================================
-- NovaWork Career Intelligence Feed — Phase 1
-- Created: 2026-04-04
-- Purpose: Foundation tables, RLS, indexes, and RPC functions
--          for the Personalized Career Intelligence Feed.
--
-- Sources: Indeed Hiring Lab (quantitative signals),
--          GDELT (low-cost news discovery),
--          NovaWork Manual Curation (quality control).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABLES
-- ────────────────────────────────────────────────────────────

-- Registry of data sources the feed can pull from
CREATE TABLE IF NOT EXISTS career_feed_sources (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,            -- e.g. 'indeed_hiring_lab', 'gdelt', 'novawork_manual'
  name        text NOT NULL,
  description text,
  source_type text NOT NULL CHECK (source_type IN ('quantitative','news','manual')),
  base_url    text,                             -- root URL for the provider
  is_active   boolean NOT NULL DEFAULT true,
  config      jsonb DEFAULT '{}'::jsonb,        -- provider-specific settings (API keys ref, cadence, etc.)
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- The main feed items (articles, signals, insights)
CREATE TABLE IF NOT EXISTS career_feed_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       uuid NOT NULL REFERENCES career_feed_sources(id) ON DELETE CASCADE,
  external_id     text,                          -- de-dup key from external provider
  title           text NOT NULL,
  summary         text,                          -- short description / abstract
  content_url     text,                          -- link to full article or report
  image_url       text,
  published_at    timestamptz,                   -- original publish date from source
  ingested_at     timestamptz NOT NULL DEFAULT now(),

  -- Classification
  item_type       text NOT NULL DEFAULT 'article'
                    CHECK (item_type IN ('article','signal','insight','report','trend')),
  category        text                           -- e.g. 'hiring_trends','layoffs','skills_demand','salary','remote_work'
                    CHECK (category IN (
                      'hiring_trends','layoffs','skills_demand',
                      'salary','remote_work','industry_shift',
                      'ai_impact','economic_outlook','career_strategy',
                      'other'
                    ) OR category IS NULL),

  -- Personalization tags (lightweight, Phase 1)
  target_roles    text[] DEFAULT '{}',           -- e.g. {'software_engineer','data_scientist'}
  target_industries text[] DEFAULT '{}',         -- e.g. {'technology','healthcare'}
  target_geographies text[] DEFAULT '{}',        -- e.g. {'US','LATAM','remote'}
  career_goals    text[] DEFAULT '{}',           -- e.g. {'transition','reinvention','alignment'}

  -- Metadata
  relevance_score numeric(4,2) DEFAULT 0,        -- 0-10 score assigned during curation
  metadata        jsonb DEFAULT '{}'::jsonb,      -- flexible extra data (keywords, sentiment, etc.)
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- De-duplication constraint
  UNIQUE (source_id, external_id)
);

-- Editorial curation layer — NovaWork reviews and approves items
CREATE TABLE IF NOT EXISTS career_feed_curation (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         uuid NOT NULL REFERENCES career_feed_items(id) ON DELETE CASCADE UNIQUE,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected','archived')),
  curator_notes   text,                          -- internal editorial comment
  novawork_take   text,                          -- "Why it matters" interpretation for users
  action_hint     text,                          -- "What you should do next" guidance
  curated_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  curated_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- User personalization preferences for the feed
CREATE TABLE IF NOT EXISTS career_feed_user_preferences (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  target_roles      text[] DEFAULT '{}',
  target_industries text[] DEFAULT '{}',
  target_geographies text[] DEFAULT '{}',
  career_goal       text CHECK (career_goal IN ('transition','reinvention','alignment') OR career_goal IS NULL),
  notification_enabled boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 2. INDEXES
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_feed_items_source      ON career_feed_items (source_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_type         ON career_feed_items (item_type);
CREATE INDEX IF NOT EXISTS idx_feed_items_category     ON career_feed_items (category);
CREATE INDEX IF NOT EXISTS idx_feed_items_published    ON career_feed_items (published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_feed_items_ingested     ON career_feed_items (ingested_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_items_roles        ON career_feed_items USING GIN (target_roles);
CREATE INDEX IF NOT EXISTS idx_feed_items_industries   ON career_feed_items USING GIN (target_industries);
CREATE INDEX IF NOT EXISTS idx_feed_items_geographies  ON career_feed_items USING GIN (target_geographies);
CREATE INDEX IF NOT EXISTS idx_feed_items_goals        ON career_feed_items USING GIN (career_goals);
CREATE INDEX IF NOT EXISTS idx_feed_curation_status    ON career_feed_curation (status);
CREATE INDEX IF NOT EXISTS idx_feed_curation_item      ON career_feed_curation (item_id);
CREATE INDEX IF NOT EXISTS idx_feed_prefs_user         ON career_feed_user_preferences (user_id);

-- ────────────────────────────────────────────────────────────
-- 3. ROW-LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE career_feed_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_feed_curation ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_feed_user_preferences ENABLE ROW LEVEL SECURITY;

-- Sources: readable by any authenticated user
CREATE POLICY "sources_read_authenticated"
  ON career_feed_sources FOR SELECT
  TO authenticated
  USING (true);

-- Feed items: readable by any authenticated user
CREATE POLICY "feed_items_read_authenticated"
  ON career_feed_items FOR SELECT
  TO authenticated
  USING (true);

-- Curation: readable by any authenticated user (only approved items shown via RPC)
CREATE POLICY "curation_read_authenticated"
  ON career_feed_curation FOR SELECT
  TO authenticated
  USING (true);

-- User preferences: users can only read/write their own
CREATE POLICY "prefs_select_own"
  ON career_feed_user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "prefs_insert_own"
  ON career_feed_user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prefs_update_own"
  ON career_feed_user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prefs_delete_own"
  ON career_feed_user_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 4. RPC FUNCTIONS
-- ────────────────────────────────────────────────────────────

-- Get personalized feed: returns approved items, optionally filtered
-- by the user's preferences (overlap on roles/industries/geo/goals).
CREATE OR REPLACE FUNCTION get_career_feed(
  p_user_id     uuid,
  p_category    text    DEFAULT NULL,
  p_item_type   text    DEFAULT NULL,
  p_limit       int     DEFAULT 20,
  p_offset      int     DEFAULT 0
)
RETURNS TABLE (
  id              uuid,
  title           text,
  summary         text,
  content_url     text,
  image_url       text,
  published_at    timestamptz,
  item_type       text,
  category        text,
  relevance_score numeric,
  source_name     text,
  source_slug     text,
  novawork_take   text,
  action_hint     text,
  target_roles    text[],
  target_industries text[],
  target_geographies text[],
  career_goals    text[],
  metadata        jsonb
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_roles       text[];
  v_industries  text[];
  v_geos        text[];
  v_goal        text;
BEGIN
  -- Load user preferences (if any)
  SELECT up.target_roles, up.target_industries, up.target_geographies, up.career_goal
    INTO v_roles, v_industries, v_geos, v_goal
    FROM career_feed_user_preferences up
   WHERE up.user_id = p_user_id;

  RETURN QUERY
  SELECT
    fi.id,
    fi.title,
    fi.summary,
    fi.content_url,
    fi.image_url,
    fi.published_at,
    fi.item_type,
    fi.category,
    fi.relevance_score,
    fs.name   AS source_name,
    fs.slug   AS source_slug,
    fc.novawork_take,
    fc.action_hint,
    fi.target_roles,
    fi.target_industries,
    fi.target_geographies,
    fi.career_goals,
    fi.metadata
  FROM career_feed_items fi
  JOIN career_feed_sources  fs ON fs.id = fi.source_id
  JOIN career_feed_curation fc ON fc.item_id = fi.id AND fc.status = 'approved'
  WHERE fs.is_active = true
    AND (p_category  IS NULL OR fi.category  = p_category)
    AND (p_item_type IS NULL OR fi.item_type = p_item_type)
  ORDER BY
    -- Boost items matching user preferences
    CASE WHEN v_roles IS NOT NULL AND fi.target_roles && v_roles THEN 1 ELSE 0 END +
    CASE WHEN v_industries IS NOT NULL AND fi.target_industries && v_industries THEN 1 ELSE 0 END +
    CASE WHEN v_geos IS NOT NULL AND fi.target_geographies && v_geos THEN 1 ELSE 0 END +
    CASE WHEN v_goal IS NOT NULL AND v_goal = ANY(fi.career_goals) THEN 1 ELSE 0 END
    DESC,
    fi.relevance_score DESC,
    fi.published_at DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Get feed stats (for admin/curator dashboard in future phases)
CREATE OR REPLACE FUNCTION get_career_feed_stats()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_items',    (SELECT count(*) FROM career_feed_items),
    'pending',        (SELECT count(*) FROM career_feed_curation WHERE status = 'pending'),
    'approved',       (SELECT count(*) FROM career_feed_curation WHERE status = 'approved'),
    'rejected',       (SELECT count(*) FROM career_feed_curation WHERE status = 'rejected'),
    'sources_active', (SELECT count(*) FROM career_feed_sources WHERE is_active = true)
  ) INTO v_result;
  RETURN v_result;
END;
$$;
