import { useTranslation } from "react-i18next";

interface MainMenuScreenProps {
  onCampaign: () => void;
  onEditor: () => void;
  onOptions: () => void;
}

export function MainMenuScreen({ onCampaign, onEditor, onOptions }: MainMenuScreenProps) {
  const { t } = useTranslation();

  return (
    <section className="overlay-panel menu-panel">
      <div className="menu-copy">
        <span className="panel-eyebrow">{t("menu.eyebrow")}</span>
        <h1>{t("menu.title")}</h1>
        <p>{t("menu.subtitle")}</p>
      </div>
      <div className="menu-actions">
        <button type="button" className="menu-button" onClick={onCampaign}>
          {t("menu.campaign")}
        </button>
        <button type="button" className="menu-button" onClick={onEditor}>
          {t("menu.editor")}
        </button>
        <button type="button" className="menu-button is-disabled" disabled title={t("menu.onlineDisabled")}>
          {t("menu.online")}
        </button>
        <button type="button" className="menu-button secondary" onClick={onOptions}>
          {t("menu.options")}
        </button>
      </div>
    </section>
  );
}
