/**
 * Career Feed — Run All Ingestion Sources
 *
 * Usage:
 *   node scripts/ingest-all.js
 *   node scripts/ingest-all.js --timespan=7d --max=15
 */

import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const args = process.argv.slice(2).join(' ')

console.log('═══════════════════════════════════════════')
console.log('  NovaWork Career Feed — Full Ingestion')
console.log('═══════════════════════════════════════════')

const scripts = [
  { name: 'Indeed Hiring Lab', file: 'ingest-indeed-hiring-lab.js' },
  { name: 'GDELT', file: 'ingest-gdelt.js' },
]

for (const script of scripts) {
  console.log(`\n──── ${script.name} ────`)
  try {
    execSync(`node "${path.join(__dirname, script.file)}" ${args}`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    })
  } catch (err) {
    console.error(`❌ ${script.name} failed, continuing...`)
  }
}

console.log('\n═══════════════════════════════════════════')
console.log('  Ingestion complete. Review items at:')
console.log('  /dashboard/career-feed-curation')
console.log('═══════════════════════════════════════════\n')
