import { useTranslation } from "react-i18next";

interface PauseMenuScreenProps {
  onResume: () => void;
  onReturnToMainMenu: () => void;
}

export function PauseMenuScreen({ onResume, onReturnToMainMenu }: PauseMenuScreenProps) {
  const { t } = useTranslation();

  return (
    <div className="pause-overlay">
      <section className="overlay-panel pause-panel">
        <div className="panel-copy">
          <span className="panel-eyebrow">{t("pause.eyebrow")}</span>
          <h2>{t("pause.title")}</h2>
          <p>{t("pause.subtitle")}</p>
        </div>

        <div className="menu-actions">
          <button type="button" className="menu-button" onClick={onResume}>
            {t("pause.resume")}
          </button>
          <button type="button" className="menu-button secondary" onClick={onReturnToMainMenu}>
            {t("pause.go_to_main_menu")}
          </button>
        </div>
      </section>
    </div>
  );
}
