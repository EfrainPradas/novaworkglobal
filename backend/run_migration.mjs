import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

const migrationSQL = readFileSync(
  join(__dirname, '../supabase/migrations/20260314000001_agent_infrastructure.sql'),
  'utf8'
);

console.log('Attempting to apply migration via Supabase Management API...');

// Try via management API first
const resp = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_KEY}`,
  },
  body: JSON.stringify({ query: migrationSQL }),
});

if (resp.ok || resp.status === 201 || resp.status === 204) {
  console.log('✅ Migration applied via Management API');
} else {
  const errText = await resp.text();
  console.log(`Management API status: ${resp.status}`);
  console.log('Response:', errText.substring(0, 300));
  console.log('\n⚠️  Please apply the migration manually via Supabase Dashboard SQL Editor:');
  console.log('File: supabase/migrations/20260314000001_agent_infrastructure.sql');
}
