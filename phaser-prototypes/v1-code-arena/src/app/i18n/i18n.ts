import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { menu as menuEn } from "./locales/en/menu";
import { options as optionsEn } from "./locales/en/options";
import { pause as pauseEn } from "./locales/en/pause";
import { campaign as campaignEn } from "./locales/en/campaign";
import { editor as editorEn } from "./locales/en/editor";
import { debug as debugEn } from "./locales/en/debug";
import { menu as menuEs } from "./locales/es/menu";
import { options as optionsEs } from "./locales/es/options";
import { pause as pauseEs } from "./locales/es/pause";
import { campaign as campaignEs } from "./locales/es/campaign";
import { editor as editorEs } from "./locales/es/editor";
import { debug as debugEs } from "./locales/es/debug";
import { menu as menuCa } from "./locales/ca/menu";
import { options as optionsCa } from "./locales/ca/options";
import { pause as pauseCa } from "./locales/ca/pause";
import { campaign as campaignCa } from "./locales/ca/campaign";
import { editor as editorCa } from "./locales/ca/editor";
import { debug as debugCa } from "./locales/ca/debug";
import type { SupportedLocale } from "../routing/appState";

export const LOCALE_STORAGE_KEY = "canuter.locale";

const resources = {
  en: {
    translation: {
      menu: menuEn,
      options: optionsEn,
      pause: pauseEn,
      campaign: campaignEn,
      editor: editorEn,
      debug: debugEn,
    },
  },
  es: {
    translation: {
      menu: menuEs,
      options: optionsEs,
      pause: pauseEs,
      campaign: campaignEs,
      editor: editorEs,
      debug: debugEs,
    },
  },
  ca: {
    translation: {
      menu: menuCa,
      options: optionsCa,
      pause: pauseCa,
      campaign: campaignCa,
      editor: editorCa,
      debug: debugCa,
    },
  },
} as const;

export function getInitialLocale(): SupportedLocale {
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === "en" || stored === "es" || stored === "ca") {
    return stored;
  }

  return "en";
}

export async function initializeI18n(locale: SupportedLocale): Promise<void> {
  if (i18n.isInitialized) {
    await i18n.changeLanguage(locale);
    return;
  }

  await i18n.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
}

export async function applyLocale(locale: SupportedLocale): Promise<void> {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  await i18n.changeLanguage(locale);
}

export { i18n };
