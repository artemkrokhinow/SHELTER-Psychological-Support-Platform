import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from '../locales/en.json';
import uaTranslation from '../locales/ua.json';

// Configure language detector
const languageDetector = new LanguageDetector();
languageDetector.addDetector({
  name: 'cisDetector',
  lookup(options) {
    const lang = navigator.language || navigator.userLanguage || '';
    const lowerLang = lang.toLowerCase();
    
    // Check if it's a CIS language
    if (lowerLang.startsWith('uk') || lowerLang.startsWith('ru') || lowerLang.startsWith('be') || lowerLang.startsWith('kk')) {
      return 'ua';
    }
    return 'en'; // Default to English for everyone else
  },
  cacheUserLanguage(lng, options) {
    localStorage.setItem('i18nextLng', lng);
  }
});

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      ua: {
        translation: uaTranslation
      }
    },
    fallbackLng: 'en',
    
    // We only use our custom detector and localStorage
    detection: {
      order: ['localStorage', 'cisDetector'],
      caches: ['localStorage'],
    },
    
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    }
  });

export default i18n;
