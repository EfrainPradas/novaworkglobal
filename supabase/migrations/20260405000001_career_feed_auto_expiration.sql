-- ============================================================
-- Career Intelligence Feed — Auto-expiration (30 days)
-- Created: 2026-04-05
-- Purpose: Filter out feed items older than 30 days from the
--          personalized feed. Items remain in the DB but stop
--          appearing in user-facing queries.
-- ============================================================

DROP FUNCTION IF EXISTS get_career_feed(uuid,text,text,integer,integer);

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
  metadata        jsonb,
  is_featured     boolean
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_roles       text[];
  v_industries  text[];
  v_geos        text[];
  v_goal        text;
BEGIN
  SELECT up.target_roles, up.target_industries, up.target_geographies, up.career_goal
    INTO v_roles, v_industries, v_geos, v_goal
    FROM career_feed_user_preferences up
   WHERE up.user_id = p_user_id;

  RETURN QUERY
  SELECT
    fi.id, fi.title, fi.summary, fi.content_url, fi.image_url,
    fi.published_at, fi.item_type, fi.category, fi.relevance_score,
    fs.name AS source_name, fs.slug AS source_slug,
    fc.novawork_take, fc.action_hint,
    fi.target_roles, fi.target_industries, fi.target_geographies,
    fi.career_goals, fi.metadata, fc.is_featured
  FROM career_feed_items fi
  JOIN career_feed_sources  fs ON fs.id = fi.source_id
  JOIN career_feed_curation fc ON fc.item_id = fi.id AND fc.status IN ('approved','published')
  WHERE fs.is_active = true
    AND (p_category  IS NULL OR fi.category  = p_category)
    AND (p_item_type IS NULL OR fi.item_type = p_item_type)
    -- Auto-expiration: exclude items older than 30 days
    AND COALESCE(fi.published_at, fi.ingested_at) >= now() - interval '30 days'
  ORDER BY
    fc.is_featured DESC,
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
