-- Reset Career Vision flag for existing user
-- This allows them to see the Career Vision Welcome page again

-- Find your user_id first
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Then reset the flags (replace 'YOUR-USER-ID' with actual ID from above)
UPDATE user_profiles
SET
  has_seen_career_vision_prompt = false,
  career_vision_started = false,
  career_vision_completed = false,
  career_vision_skipped = false
WHERE user_id = 'YOUR-USER-ID';

-- Verify the update
SELECT
  user_id,
  has_seen_career_vision_prompt,
  career_vision_started,
  career_vision_skipped
FROM user_profiles
WHERE user_id = 'YOUR-USER-ID';
