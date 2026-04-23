import "./styles/editor.css";
import { createEditorApp } from "./app/createEditorApp";
import { getInitialLocale, i18n, initializeI18n } from "../app/i18n/i18n";
import { loadPrototypeSettings } from "../settings/loadPrototypeSettings";
import { applyUiTheme } from "../settings/applyUiTheme";

const root = document.querySelector<HTMLDivElement>("#editor-app");

if (!root) {
  throw new Error("Could not find #editor-app to mount the editor.");
}

applyUiTheme(loadPrototypeSettings());

void initializeI18n(getInitialLocale()).then(() => createEditorApp(root, { i18n }));
