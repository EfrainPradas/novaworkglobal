-- Add label column to academy_nodes for storing display name directly
ALTER TABLE academy_nodes ADD COLUMN IF NOT EXISTS label VARCHAR(255);
