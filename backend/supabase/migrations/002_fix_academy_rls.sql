-- NovaNext Academy - Clean Fix (v2)
-- Use UNIQUE policy names to avoid conflicts

-- 1. Add language column if missing
ALTER TABLE academy_resources ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- 2. Rename columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'academy_resources' AND column_name = 'title_key') THEN
    ALTER TABLE academy_resources RENAME COLUMN title_key TO title;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'academy_resources' AND column_name = 'description_key') THEN
    ALTER TABLE academy_resources RENAME COLUMN description_key TO description;
  END IF;
END $$;

-- 3. Drop all policies (with all possible names)
DROP POLICY IF EXISTS "Allow read academy_nodes" ON academy_nodes;
DROP POLICY IF EXISTS "Allow insert academy_nodes" ON academy_nodes;
DROP POLICY IF EXISTS "Allow update academy_nodes" ON academy_nodes;
DROP POLICY IF EXISTS "Allow read own layouts" ON user_node_layouts;
DROP POLICY IF EXISTS "Allow insert own layouts" ON user_node_layouts;
DROP POLICY IF EXISTS "Allow update own layouts" ON user_node_layouts;
DROP POLICY IF EXISTS "Allow read own node_layouts" ON user_node_layouts;
DROP POLICY IF EXISTS "Allow insert own node_layouts" ON user_node_layouts;
DROP POLICY IF EXISTS "Allow update own node_layouts" ON user_node_layouts;
DROP POLICY IF EXISTS "Allow delete own node_layouts" ON user_node_layouts;
DROP POLICY IF EXISTS "Allow read node_layouts" ON user_node_layouts;
DROP POLICY IF EXISTS "Allow insert node_layouts" ON user_node_layouts;
DROP POLICY IF EXISTS "Allow update node_layouts" ON user_node_layouts;
DROP POLICY IF EXISTS "Allow delete node_layouts" ON user_node_layouts;
DROP POLICY IF EXISTS "Allow read resources" ON academy_resources;
DROP POLICY IF EXISTS "Allow insert resources" ON academy_resources;
DROP POLICY IF EXISTS "Allow read academy_resources" ON academy_resources;
DROP POLICY IF EXISTS "Allow insert academy_resources" ON academy_resources;
DROP POLICY IF EXISTS "Allow update academy_resources" ON academy_resources;
DROP POLICY IF EXISTS "Allow delete academy_resources" ON academy_resources;
DROP POLICY IF EXISTS "Allow read own progress" ON user_learning_progress;
DROP POLICY IF EXISTS "Allow insert own progress" ON user_learning_progress;
DROP POLICY IF EXISTS "Allow update own progress" ON user_learning_progress;
DROP POLICY IF EXISTS "Allow read progress" ON user_learning_progress;
DROP POLICY IF EXISTS "Allow insert progress" ON user_learning_progress;
DROP POLICY IF EXISTS "Allow update progress" ON user_learning_progress;
DROP POLICY IF EXISTS "Allow read own state" ON user_academy_state;
DROP POLICY IF EXISTS "Allow insert own state" ON user_academy_state;
DROP POLICY IF EXISTS "Allow update own state" ON user_academy_state;
DROP POLICY IF EXISTS "Allow read state" ON user_academy_state;
DROP POLICY IF EXISTS "Allow insert state" ON user_academy_state;
DROP POLICY IF EXISTS "Allow update state" ON user_academy_state;

-- 4. Create new policies with UNIQUE names
CREATE POLICY "academy_v1_read" ON academy_nodes FOR SELECT TO authenticated USING (true);
CREATE POLICY "academy_v1_insert" ON academy_nodes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "academy_v1_update" ON academy_nodes FOR UPDATE TO authenticated USING (true);

CREATE POLICY "layouts_v1_read" ON user_node_layouts FOR SELECT TO authenticated USING (true);
CREATE POLICY "layouts_v1_insert" ON user_node_layouts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "layouts_v1_update" ON user_node_layouts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "layouts_v1_delete" ON user_node_layouts FOR DELETE TO authenticated USING (true);

CREATE POLICY "res_v1_read" ON academy_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "res_v1_insert" ON academy_resources FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "res_v1_update" ON academy_resources FOR UPDATE TO authenticated USING (true);
CREATE POLICY "res_v1_delete" ON academy_resources FOR DELETE TO authenticated USING (true);

CREATE POLICY "prog_v1_read" ON user_learning_progress FOR SELECT TO authenticated USING (true);
CREATE POLICY "prog_v1_insert" ON user_learning_progress FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "prog_v1_update" ON user_learning_progress FOR UPDATE TO authenticated USING (true);

CREATE POLICY "state_v1_read" ON user_academy_state FOR SELECT TO authenticated USING (true);
CREATE POLICY "state_v1_insert" ON user_academy_state FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "state_v1_update" ON user_academy_state FOR UPDATE TO authenticated USING (true);

-- 5. Seed nodes if empty
INSERT INTO academy_nodes (id, parent_id, level, label_key, type, default_x, default_y, icon, color, sort_order)
SELECT '00000000-0000-0000-0000-000000000001', NULL, 1, 'academy.title', 'root', 400, 400, 'graduation-cap', '#10B981', 0
WHERE NOT EXISTS (SELECT 1 FROM academy_nodes WHERE id = '00000000-0000-0000-0000-000000000001');

INSERT INTO academy_nodes (id, parent_id, level, label_key, type, default_x, default_y, icon, color, sort_order)
SELECT '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 2, 'topics.resume', 'topic', 150, 150, 'file-text', '#3B82F6', 1
WHERE NOT EXISTS (SELECT 1 FROM academy_nodes WHERE id = '00000000-0000-0000-0000-000000000010');

INSERT INTO academy_nodes (id, parent_id, level, label_key, type, default_x, default_y, icon, color, sort_order)
SELECT '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 2, 'topics.interview', 'topic', 400, 100, 'users', '#8B5CF6', 2
WHERE NOT EXISTS (SELECT 1 FROM academy_nodes WHERE id = '00000000-0000-0000-0000-000000000020');

INSERT INTO academy_nodes (id, parent_id, level, label_key, type, default_x, default_y, icon, color, sort_order)
SELECT '00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 2, 'topics.jobSearch', 'topic', 650, 150, 'briefcase', '#F59E0B', 3
WHERE NOT EXISTS (SELECT 1 FROM academy_nodes WHERE id = '00000000-0000-0000-0000-000000000030');

INSERT INTO academy_nodes (id, parent_id, level, label_key, type, default_x, default_y, icon, color, sort_order)
SELECT '00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 2, 'topics.networking', 'topic', 150, 650, 'network', '#EC4899', 4
WHERE NOT EXISTS (SELECT 1 FROM academy_nodes WHERE id = '00000000-0000-0000-0000-000000000040');

INSERT INTO academy_nodes (id, parent_id, level, label_key, type, default_x, default_y, icon, color, sort_order)
SELECT '00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000001', 2, 'topics.salary', 'topic', 650, 650, 'dollar-sign', '#10B981', 5
WHERE NOT EXISTS (SELECT 1 FROM academy_nodes WHERE id = '00000000-0000-0000-0000-000000000050');
