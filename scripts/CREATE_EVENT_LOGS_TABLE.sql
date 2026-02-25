-- ============================================================================
-- EVENT LOG ARCHITECTURE (Telemetry, Observability, Audit)
-- ============================================================================

-- Create the Enum for Event Categories to optimize querying
-- NOTE: Commented out because the 'event_category' type already exists in your database.
-- DO $$ BEGIN
--     CREATE TYPE event_category AS ENUM ('analytics', 'observability', 'audit');
-- EXCEPTION
--     WHEN duplicate_object THEN null;
-- END $$;

-- Create the main Events table
CREATE TABLE IF NOT EXISTS event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id UUID, -- Useful for tracking a single funnel attempt
    event_category event_category NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    
    -- Entity references (No PII, just IDs)
    target_entity_type VARCHAR(50), -- e.g., 'resume', 'accomplishment', 'education'
    target_entity_id UUID,          -- The ID of the modified or parsed record
    
    -- Flexible metadata
    event_properties JSONB DEFAULT '{}'::JSONB,
    
    -- Client Context
    user_agent TEXT,
    ip_address INET
);

-- Row Level Security (RLS) Configuration
-- Event logs should only be written to, and users can only view their own.
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert event logs" ON event_logs;
CREATE POLICY "Users can insert event logs" 
  ON event_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL); 
  -- Allow anon inserts if user_id is null, though we prefer authenticated.

DROP POLICY IF EXISTS "Users can view own event logs" ON event_logs;
CREATE POLICY "Users can view own event logs" 
  ON event_logs FOR SELECT 
  USING (auth.uid() = user_id);

-- Indexes for fast querying in Metabase/Grafana/Supabase Dashboards
CREATE INDEX IF NOT EXISTS idx_event_logs_user_id ON event_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_event_name ON event_logs(event_name);
CREATE INDEX IF NOT EXISTS idx_event_logs_timestamp ON event_logs(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_event_logs_category ON event_logs(event_category);
CREATE INDEX IF NOT EXISTS idx_event_logs_session ON event_logs(session_id);

SELECT '✅ Event Log Architecture Initialized' as status;
