-- NovaNext Academy Database Schema
-- Run this migration to create all required tables for the Academy learning map

-- 1. Academy Nodes (static tree structure)
CREATE TABLE IF NOT EXISTS academy_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES academy_nodes(id) ON DELETE CASCADE,
  level INT NOT NULL CHECK (level IN (1, 2, 3)),
  label_key VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('root', 'topic', 'resource')),
  default_x INT NOT NULL DEFAULT 0,
  default_y INT NOT NULL DEFAULT 0,
  icon VARCHAR(100),
  color VARCHAR(7),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Node Layouts (per-user positioning and expansion state)
CREATE TABLE IF NOT EXISTS user_node_layouts (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id UUID REFERENCES academy_nodes(id) ON DELETE CASCADE,
  x INT NOT NULL DEFAULT 0,
  y INT NOT NULL DEFAULT 0,
  is_expanded BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, node_id)
);

-- 3. Academy Resources (videos, audio, articles)
CREATE TABLE IF NOT EXISTS academy_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES academy_nodes(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('video', 'audio', 'article')),
  title_key VARCHAR(255) NOT NULL,
  description_key VARCHAR(255),
  url TEXT NOT NULL,
  duration_minutes INT,
  thumbnail TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Learning Progress
CREATE TABLE IF NOT EXISTS user_learning_progress (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES academy_nodes(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES academy_resources(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percent INT DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, resource_id)
);

-- 5. User Last Selected Node (for restoring state)
CREATE TABLE IF NOT EXISTS user_academy_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_node_id UUID REFERENCES academy_nodes(id) ON DELETE SET NULL,
  selected_topic_id UUID REFERENCES academy_nodes(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_academy_nodes_parent ON academy_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_academy_nodes_level ON academy_nodes(level);
CREATE INDEX IF NOT EXISTS idx_academy_resources_topic ON academy_resources(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_progress_user ON user_learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_progress_topic ON user_learning_progress(topic_id);

-- Row Level Security
ALTER TABLE academy_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_node_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_academy_state ENABLE ROW LEVEL SECURITY;

-- Policies for academy_nodes (read-only for all authenticated users)
CREATE POLICY "Allow read academy_nodes" ON academy_nodes
  FOR SELECT TO authenticated USING (true);

-- Policies for user_node_layouts
CREATE POLICY "Allow read own layouts" ON user_node_layouts
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Allow insert own layouts" ON user_node_layouts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow update own layouts" ON user_node_layouts
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Policies for academy_resources (read-only)
CREATE POLICY "Allow read resources" ON academy_resources
  FOR SELECT TO authenticated USING (true);

-- Policies for user_learning_progress
CREATE POLICY "Allow read own progress" ON user_learning_progress
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Allow insert own progress" ON user_learning_progress
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow update own progress" ON user_learning_progress
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Policies for user_academy_state
CREATE POLICY "Allow read own state" ON user_academy_state
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Allow insert own state" ON user_academy_state
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow update own state" ON user_academy_state
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Function to seed initial academy nodes
CREATE OR REPLACE FUNCTION seed_academy_nodes()
RETURNS void AS $$
BEGIN
  -- Only seed if table is empty
  IF NOT EXISTS (SELECT 1 FROM academy_nodes LIMIT 1) THEN
    -- Level 1: Root Node
    INSERT INTO academy_nodes (id, parent_id, level, label_key, type, default_x, default_y, icon, color, sort_order)
    VALUES ('00000000-0000-0000-0000-000000000001', NULL, 1, 'academy.title', 'root', 400, 400, 'graduation-cap', '#10B981', 0);

    -- Level 2: Topic Nodes
    INSERT INTO academy_nodes (id, parent_id, level, label_key, type, default_x, default_y, icon, color, sort_order)
    VALUES 
      ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 2, 'topics.resume', 'topic', 150, 150, 'file-text', '#3B82F6', 1),
      ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 2, 'topics.interview', 'topic', 400, 100, 'users', '#8B5CF6', 2),
      ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 2, 'topics.jobSearch', 'topic', 650, 150, 'briefcase', '#F59E0B', 3),
      ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 2, 'topics.networking', 'topic', 150, 650, 'network', '#EC4899', 4),
      ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000001', 2, 'topics.salary', 'topic', 650, 650, 'dollar-sign', '#10B981', 5);

    -- Level 3: Resume Topic Resources
    INSERT INTO academy_nodes (id, parent_id, level, label_key, type, default_x, default_y, icon, color, sort_order)
    VALUES
      ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000010', 3, 'nodes.resumeIntro', 'resource', 50, 50, 'play-circle', '#3B82F6', 1),
      ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000010', 3, 'nodes.resumeStructure', 'resource', 50, 150, 'video', '#3B82F6', 2),
      ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000010', 3, 'nodes.accomplishments', 'resource', 50, 250, 'award', '#3B82F6', 3),
      ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000010', 3, 'nodes.keywords', 'resource', 250, 50, 'tag', '#3B82F6', 4);

    -- Level 3: Interview Topic Resources
    INSERT INTO academy_nodes (id, parent_id, level, label_key, type, default_x, default_y, icon, color, sort_order)
    VALUES
      ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000020', 3, 'nodes.interviewPrep', 'resource', 300, 50, 'play-circle', '#8B5CF6', 1),
      ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000020', 3, 'nodes.commonQuestions', 'resource', 300, 150, 'help-circle', '#8B5CF6', 2),
      ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000020', 3, 'nodes.bodyLanguage', 'resource', 500, 50, 'users', '#8B5CF6', 3),
      ('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000020', 3, 'nodes.followUp', 'resource', 500, 150, 'mail', '#8B5CF6', 4);

    -- Level 3: Job Search Topic Resources
    INSERT INTO academy_nodes (id, parent_id, level, label_key, type, default_x, default_y, icon, color, sort_order)
    VALUES
      ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000030', 3, 'nodes.marketResearch', 'resource', 550, 50, 'search', '#F59E0B', 1),
      ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000030', 3, 'nodes.applications', 'resource', 550, 150, 'file-plus', '#F59E0B', 2),
      ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000030', 3, 'nodes.tracking', 'resource', 750, 50, 'clipboard', '#F59E0B', 3);

    -- Level 3: Networking Topic Resources
    INSERT INTO academy_nodes (id, parent_id, level, label_key, type, default_x, default_y, icon, color, sort_order)
    VALUES
      ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000040', 3, 'nodes.linkedIn', 'resource', 50, 550, 'linkedin', '#EC4899', 1),
      ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000040', 3, 'nodes.informationalInterviews', 'resource', 50, 650, 'message-circle', '#EC4899', 2),
      ('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000040', 3, 'nodes.elevatorPitch', 'resource', 250, 550, 'mic', '#EC4899', 3);

    -- Level 3: Salary Topic Resources
    INSERT INTO academy_nodes (id, parent_id, level, label_key, type, default_x, default_y, icon, color, sort_order)
    VALUES
      ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000050', 3, 'nodes.marketResearch', 'resource', 550, 550, 'search', '#10B981', 1),
      ('00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000050', 3, 'nodes.negotiation', 'resource', 550, 650, 'message-square', '#10B981', 2),
      ('00000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000050', 3, 'nodes.benefits', 'resource', 750, 550, 'package', '#10B981', 3);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute seeding
SELECT seed_academy_nodes();

-- Function to seed sample resources
CREATE OR REPLACE FUNCTION seed_academy_resources()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM academy_resources LIMIT 1) THEN
    -- Resume Resources
    INSERT INTO academy_resources (id, topic_id, type, title_key, description_key, url, duration_minutes, sort_order)
    VALUES
      ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000010', 'video', 'resources.resumeIntroTitle', 'resources.resumeIntroDesc', '/videos/resume-intro.mp4', 8, 1),
      ('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000010', 'audio', 'resources.resumeAudioTitle', 'resources.resumeAudioDesc', '/audio/resume-tips.mp3', 15, 2),
      ('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000010', 'article', 'resources.accomplishmentsTitle', 'resources.accomplishmentsDesc', '/articles/accomplishments.html', NULL, 3);

    -- Interview Resources
    INSERT INTO academy_resources (id, topic_id, type, title_key, description_key, url, duration_minutes, sort_order)
    VALUES
      ('10000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000020', 'video', 'resources.interviewPrepTitle', 'resources.interviewPrepDesc', '/videos/interview-prep.mp4', 12, 1),
      ('10000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000020', 'video', 'resources.commonQuestionsTitle', 'resources.commonQuestionsDesc', '/videos/common-questions.mp4', 10, 2),
      ('10000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000020', 'audio', 'resources.bodyLanguageTitle', 'resources.bodyLanguageDesc', '/audio/body-language.mp3', 20, 3);

    -- Job Search Resources
    INSERT INTO academy_resources (id, topic_id, type, title_key, description_key, url, duration_minutes, sort_order)
    VALUES
      ('10000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000030', 'video', 'resources.marketResearchTitle', 'resources.marketResearchDesc', '/videos/market-research.mp4', 15, 1),
      ('10000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000030', 'article', 'resources.applicationsTitle', 'resources.applicationsDesc', '/articles/applications.html', NULL, 2);

    -- Networking Resources
    INSERT INTO academy_resources (id, topic_id, type, title_key, description_key, url, duration_minutes, sort_order)
    VALUES
      ('10000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000040', 'video', 'resources.linkedInTitle', 'resources.linkedInDesc', '/videos/linkedin.mp4', 10, 1),
      ('10000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000040', 'audio', 'resources.elevatorPitchTitle', 'resources.elevatorPitchDesc', '/audio/elevator-pitch.mp3', 8, 2);

    -- Salary Resources
    INSERT INTO academy_resources (id, topic_id, type, title_key, description_key, url, duration_minutes, sort_order)
    VALUES
      ('10000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000050', 'video', 'resources.negotiationTitle', 'resources.negotiationDesc', '/videos/negotiation.mp4', 18, 1),
      ('10000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000050', 'article', 'resources.benefitsTitle', 'resources.benefitsDesc', '/articles/benefits.html', NULL, 2);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute resource seeding
SELECT seed_academy_resources();
