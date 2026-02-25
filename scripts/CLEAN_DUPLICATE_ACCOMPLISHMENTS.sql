-- Delete duplicates from accomplishment_bank, keeping only the most recent entry for each unique bullet_text per user
DELETE FROM accomplishment_bank
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, bullet_text) id
    FROM accomplishment_bank
    ORDER BY user_id, bullet_text, created_at DESC
);

-- Delete duplicates from accomplishments table (the ones linked to a specific work experience)
DELETE FROM accomplishments
WHERE id NOT IN (
    SELECT DISTINCT ON (work_experience_id, bullet_text) id
    FROM accomplishments
    ORDER BY work_experience_id, bullet_text, created_at DESC
);
