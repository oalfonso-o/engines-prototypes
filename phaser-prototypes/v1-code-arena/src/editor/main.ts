import "./styles/editor.css";
import { createEditorApp } from "./app/createEditorApp";

const root = document.querySelector<HTMLDivElement>("#editor-app");

if (!root) {
  throw new Error("No se encontró #editor-app para montar el editor.");
}

void createEditorApp(root);
