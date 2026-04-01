import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirnamePath = path.dirname(__filename);

/**
 * Resolve the locales directory.
 * - LOCAL DEV:  backend/routes/ -> ../../frontend/src/i18n/locales/
 * - PRODUCTION (EC2): backend/locales/   (shipped alongside the backend)
 */
const resolveLocalesPath = () => {
    // Try the local dev path first
    const devPath = path.join(__dirnamePath, '../../frontend/src/i18n/locales');
    // Production path: locales folder next to the backend root
    const prodPath = path.join(__dirnamePath, '../locales');

    // We'll check asynchronously which one exists, but for the module level
    // we'll set both and pick at runtime
    return { devPath, prodPath };
};

const { devPath, prodPath } = resolveLocalesPath();

const getLocalesPath = async () => {
    try {
        await fs.access(path.join(devPath, 'en.json'));
        return devPath;
    } catch {
        try {
            await fs.access(path.join(prodPath, 'en.json'));
            return prodPath;
        } catch {
            console.error('❌ Could not find locales directory at:', devPath, 'or', prodPath);
            return prodPath; // fallback
        }
    }
};

const supportedLanguages = ['en', 'es', 'fr', 'it', 'pt'];

/**
 * PAGE GROUPING: Maps top-level JSON keys to human-readable page names.
 */
const PAGE_GROUPS = {
    // 1. PANEL PRINCIPAL
    'Panel Principal': ['dashboard', 'home', 'sidebarOverview'],

    // 2. PROGRAMAS NOVANEXT
    'Programas NovaNext': ['resumeBuilder', 'careerVision', 'jobSearch', 'onlineApplications', 'checklist', 'interview'],

    // 3. COMUNIDAD
    'Comunidad': ['sidebarCommunity', 'membership'],

    // 4. NOVANEXT ACADEMY
    'NovaNext Academy': ['novaNextAcademy', 'topics', 'learningModules'],

    // 5. HERRAMIENTAS
    'Herramientas': ['sidebarTools', 'sharedResources'],

    // 6. SISTEMA Y LANDING (Common/Auth/Global)
    'Sitio Web y Sistema': ['hero', 'trust', 'problem', 'philosophy', 'differentiator', 'programs', 'cta', 'nav', 'footer', 'auth', 'onboarding', 'common'],
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
 */
router.get('/', async (req, res) => {
    try {
        const localesPath = await getLocalesPath();
        const translationsDatabase = {};

        const processJSON = (lang, obj, currentPrefix = '', topLevelKey = null) => {
            for (const [key, value] of Object.entries(obj)) {
                const currentTopKey = topLevelKey || key;
                const pageName = keyToPage[currentTopKey] || 'Other';
                const pathKey = topLevelKey
                    ? (currentPrefix ? `${currentPrefix}.${key}` : key)
                    : '';

                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    processJSON(lang, value, pathKey, currentTopKey);
                } else {
                    const displayKey = pathKey ? `${currentTopKey}.${pathKey}` : currentTopKey;
                    if (!translationsDatabase[pageName]) translationsDatabase[pageName] = {};
                    if (!translationsDatabase[pageName][displayKey]) translationsDatabase[pageName][displayKey] = {};
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
 * Body: { lang: 'es', key: 'hero.title', value: 'Nuevo Título' }
 */
router.post('/', async (req, res) => {
    try {
        const localesPath = await getLocalesPath();
        const { lang, key, value } = req.body;

        console.log(`📝 Translation save: lang=${lang}, key=${key}, value="${String(value).substring(0, 50)}..."`);

        if (!lang || !key || value === undefined) {
            return res.status(400).json({ error: 'Missing required fields: lang, key, value' });
        }
        if (!supportedLanguages.includes(lang)) {
            return res.status(400).json({ error: `Unsupported language: ${lang}` });
        }

        const filePath = path.join(localesPath, `${lang}.json`);

        let currentJSON = {};
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            currentJSON = JSON.parse(data);
        } catch (err) {
            console.warn(`File ${lang}.json not found or malformed, creating new.`);
        }

        setNestedValue(currentJSON, key, value);
        await fs.writeFile(filePath, JSON.stringify(currentJSON, null, 2) + '\n', 'utf-8');

        console.log(`✅ Saved ${key} in ${lang}.json`);
        res.json({ success: true, message: `Updated ${key} in ${lang}.json` });
    } catch (error) {
        console.error('Error saving translation:', error);
        res.status(500).json({ error: 'Failed to save translation update' });
    }
});

/**
 * POST /api/translations/academy-topic
 * Body: { key: 'test2', value: 'Test 2' }
 * Updates the topic key in all 5 language files
 */
router.post('/academy-topic', async (req, res) => {
    try {
        const localesPath = await getLocalesPath();
        const { key, value } = req.body;

        console.log(`📝 Adding academy topic: key=${key}, value="${value}"`);

        if (!key || value === undefined) {
            return res.status(400).json({ error: 'Missing required fields: key, value' });
        }

        const results = [];
        for (const lang of supportedLanguages) {
            const filePath = path.join(localesPath, `${lang}.json`);
            
            let currentJSON = {};
            try {
                const data = await fs.readFile(filePath, 'utf-8');
                currentJSON = JSON.parse(data);
            } catch (err) {
                console.warn(`File ${lang}.json not found, creating new.`);
            }

            if (!currentJSON.topics) {
                currentJSON.topics = {};
            }
            currentJSON.topics[key] = value;

            await fs.writeFile(filePath, JSON.stringify(currentJSON, null, 2) + '\n', 'utf-8');
            results.push(lang);
        }

        console.log(`✅ Added topic "${key}" to ${results.join(', ')}`);
        res.json({ success: true, message: `Updated topic in ${results.length} languages`, languages: results });
    } catch (error) {
        console.error('Error adding academy topic:', error);
        res.status(500).json({ error: 'Failed to add academy topic' });
    }
});

/**
 * GET /api/translations/download/:lang
 * Downloads a specific language JSON file (for syncing back to the repo)
 */
router.get('/download/:lang', async (req, res) => {
    try {
        const localesPath = await getLocalesPath();
        const { lang } = req.params;

        if (!supportedLanguages.includes(lang)) {
            return res.status(400).json({ error: `Unsupported language: ${lang}` });
        }

        const filePath = path.join(localesPath, `${lang}.json`);
        const data = await fs.readFile(filePath, 'utf-8');

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${lang}.json"`);
        res.send(data);
    } catch (error) {
        console.error('Error downloading translation:', error);
        res.status(500).json({ error: 'Failed to download translation file' });
    }
});

export default router;
