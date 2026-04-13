import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import it from './locales/it.json'
import pt from './locales/pt.json'

const SUPPORTED_LANGS = ['en', 'es', 'fr', 'it', 'pt']
const STORAGE_KEY = 'novawork_lang'

function getInitialLanguage(): string {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && SUPPORTED_LANGS.includes(saved)) return saved
  const browser = navigator.language?.split('-')[0] || 'en'
  return SUPPORTED_LANGS.includes(browser) ? browser : 'en'
}

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  it: { translation: it },
  pt: { translation: pt },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

// Persist language on every change
i18n.on('languageChanged', (lng: string) => {
  localStorage.setItem(STORAGE_KEY, lng)
})

export default i18n
