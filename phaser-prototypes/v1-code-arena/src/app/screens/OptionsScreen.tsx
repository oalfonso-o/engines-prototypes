import { useTranslation } from "react-i18next";
import type { SupportedLocale } from "../routing/appState";

interface OptionsScreenProps {
  locale: SupportedLocale;
  onLocaleChange: (locale: SupportedLocale) => void;
  onBack: () => void;
}

const LOCALE_OPTIONS: SupportedLocale[] = ["en", "es", "ca"];

export function OptionsScreen({ locale, onLocaleChange, onBack }: OptionsScreenProps) {
  const { t } = useTranslation();

  return (
    <section className="overlay-panel options-panel">
      <div className="panel-copy">
        <span className="panel-eyebrow">{t("options.eyebrow")}</span>
        <h2>{t("options.title")}</h2>
        <p>{t("options.subtitle")}</p>
      </div>

      <div className="language-card">
        <span className="language-label">{t("options.language.title")}</span>
        <div className="language-list">
          {LOCALE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={option === locale ? "language-option is-active" : "language-option"}
              onClick={() => onLocaleChange(option)}
            >
              {t(`options.language.${option}`)}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="menu-button secondary" onClick={onBack}>
        {t("options.back")}
      </button>
    </section>
  );
}
