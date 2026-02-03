-- Query to list all tables in the 'public' schema
SELECT 
  table_schema, 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
