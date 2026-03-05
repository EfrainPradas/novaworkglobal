import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirnamePath = path.dirname(__filename);

// Path to the frontend locales directory (backend/routes/ -> frontend/src/i18n/locales/)
const localesPath = path.join(__dirnamePath, '../../frontend/src/i18n/locales');

const supportedLanguages = ['en', 'es', 'fr', 'it', 'pt'];

/**
 * PAGE GROUPING: Maps top-level JSON keys to human-readable page names.
 * This lets the UI show "Landing Page" instead of individual keys like hero, trust, etc.
 */
const PAGE_GROUPS = {
    'Landing Page': ['hero', 'trust', 'problem', 'philosophy', 'differentiator', 'programs', 'cta'],
    'Navigation & Footer': ['nav', 'footer'],
    'Common': ['common'],
    'Authentication': ['auth'],
    'Onboarding': ['onboarding'],
    'Resume Builder': ['resumeBuilder'],
    'Dashboard': ['dashboard'],
};

// Build reverse lookup: jsonKey -> pageName
const keyToPage = {};
for (const [pageName, keys] of Object.entries(PAGE_GROUPS)) {
    for (const key of keys) {
        keyToPage[key] = pageName;
    }
}

/**
 * GET /api/translations
 * Returns all translations grouped by PAGE (not raw JSON key).
 * Structure:
 * {
 *   "Landing Page": {
 *     "hero.title": { en: "...", es: "...", ... },
 *     "trust.subtitle": { en: "...", es: "...", ... }
 *   },
 *   "Dashboard": { ... }
 * }
 */
router.get('/', async (req, res) => {
    try {
        const translationsDatabase = {};

        // Recursive flattener: produces flat keys like "signIn.email" under a screen
        const processJSON = (lang, obj, currentPrefix = '', topLevelKey = null) => {
            for (const [key, value] of Object.entries(obj)) {
                const currentTopKey = topLevelKey || key;

                // Determine which page group this belongs to
                const pageName = keyToPage[currentTopKey] || 'Other';

                // Build the flat path for child keys (skip top-level key itself)
                const pathKey = topLevelKey
                    ? (currentPrefix ? `${currentPrefix}.${key}` : key)
                    : '';

                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    processJSON(lang, value, pathKey, currentTopKey);
                } else {
                    // Leaf node - use "topLevelKey.subpath" as display key
                    const displayKey = pathKey ? `${currentTopKey}.${pathKey}` : currentTopKey;

                    if (!translationsDatabase[pageName]) {
                        translationsDatabase[pageName] = {};
                    }
                    if (!translationsDatabase[pageName][displayKey]) {
                        translationsDatabase[pageName][displayKey] = {};
                    }
                    translationsDatabase[pageName][displayKey][lang] = value;
                }
            }
        };

        for (const lang of supportedLanguages) {
            const filePath = path.join(localesPath, `${lang}.json`);
            try {
                const data = await fs.readFile(filePath, 'utf-8');
                const json = JSON.parse(data);
                processJSON(lang, json);
            } catch (err) {
                console.warn(`Could not read ${lang}.json:`, err.message);
            }
        }

        res.json({ success: true, screens: translationsDatabase });
    } catch (error) {
        console.error('Error fetching translations:', error);
        res.status(500).json({ error: 'Failed to retrieve translations' });
    }
});

/**
 * Helper to update a nested key in a JSON object
 * e.g. setNestedValue(obj, "hero.title", "New Title")
 */
const setNestedValue = (obj, pathString, value) => {
    const keys = pathString.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }

    current[keys[keys.length - 1]] = value;
};

/**
 * POST /api/translations
 * Updates a specific translation key for a specific language.
 * Body: { lang: 'es', key: 'hero.title', value: 'Nuevo Título' }
 * The `key` is the FULL dot-path as it exists inside the JSON file.
 */
router.post('/', async (req, res) => {
    try {
        const { lang, key, value } = req.body;

        console.log(`📝 Translation save request: lang=${lang}, key=${key}, value="${String(value).substring(0, 50)}..."`);

        if (!lang || !key || value === undefined) {
            return res.status(400).json({ error: 'Missing required fields: lang, key, value' });
        }

        if (!supportedLanguages.includes(lang)) {
            return res.status(400).json({ error: `Unsupported language: ${lang}` });
        }

        const filePath = path.join(localesPath, `${lang}.json`);

        // Read existing file
        let currentJSON = {};
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            currentJSON = JSON.parse(data);
        } catch (err) {
            console.warn(`File ${lang}.json not found or malformed, creating new.`);
        }

        // Apply update using the full dot-path key
        setNestedValue(currentJSON, key, value);

        // Write back to file with 2-space formatting
        await fs.writeFile(filePath, JSON.stringify(currentJSON, null, 2) + '\n', 'utf-8');

        console.log(`✅ Saved ${key} in ${lang}.json`);
        res.json({ success: true, message: `Updated ${key} in ${lang}.json` });
    } catch (error) {
        console.error('Error saving translation:', error);
        res.status(500).json({ error: 'Failed to save translation update' });
    }
});

export default router;
