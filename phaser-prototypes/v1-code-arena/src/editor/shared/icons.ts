import { createElement } from "./dom";

export type EditorIconName =
  | "back"
  | "plus"
  | "folder"
  | "folder-open"
  | "raw-asset"
  | "tileset"
  | "spritesheet"
  | "animation"
  | "character"
  | "map"
  | "level"
  | "archive"
  | "restore"
  | "chevron-left"
  | "chevron-right"
  | "chevron-down";

const ICONS: Record<EditorIconName, string> = {
  back: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.9 3.2 5.4 7.7a.5.5 0 0 0 0 .7l4.5 4.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  plus: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.3v9.4M3.3 8h9.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  folder: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.8 4.2h4l1.1 1.2h7.3v6.4a1 1 0 0 1-1 1H2.8a1 1 0 0 1-1-1z" fill="currentColor" opacity=".9"/><path d="M1.8 4.2h4l1.1 1.2h7.3" fill="none" stroke="currentColor" stroke-width="1" opacity=".75"/></svg>`,
  "folder-open": `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.7 5.1h4.1l1.1 1.2h7.2l-1.2 5.4a1 1 0 0 1-1 .8H3a1 1 0 0 1-1-.8z" fill="currentColor" opacity=".9"/><path d="M1.7 5.1h4.1l1.1 1.2h7.2" fill="none" stroke="currentColor" stroke-width="1" opacity=".75"/></svg>`,
  "raw-asset": `<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.2" y="2.2" width="11.6" height="11.6" rx="2" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="5.5" cy="5.3" r="1.1" fill="currentColor"/><path d="m4 11 2.3-2.6 1.8 1.9 2.1-2.3L12 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  tileset: `<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.2" y="2.2" width="11.6" height="11.6" rx="2" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M4.2 9.6h7.6M8 3.6v8.8M3.6 6.6h8.8M5.2 3.6h5.6v8.8H5.2z" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  spritesheet: `<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.4" y="2.8" width="8.4" height="8.4" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="m4 9 1.8-2 1.5 1.4 1.4-1.7 1.3 2.3" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/><rect x="8.2" y="5.2" width="5.2" height="7.8" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".8"/><path d="M9.9 7.4h1.8M9.9 9.3h1.8M9.9 11.2h1.8" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity=".8"/></svg>`,
  animation: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.3h8.3l1.7 2v5.4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M3.4 4.3 5 2.8h6l-1.6 1.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M6 8.1v2.4l2.4-1.2z" fill="currentColor"/></svg>`,
  character: `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="4.5" r="2" fill="currentColor"/><path d="M8 7v5.3M5.1 13.1 8 9.6l2.9 3.5M5.5 8.2 8 7l2.5 1.2" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  map: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 3.3 6.2 2l3.6 1.3 3.7-1.3v10.7l-3.7 1.3-3.6-1.3-3.7 1.3z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M6.2 2v10.7M9.8 3.3V14" fill="none" stroke="currentColor" stroke-width="1"/></svg>`,
  level: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 2.7h7.6a1 1 0 0 1 1 1v8.6l-2.2-1.3-2.4 1.3L5 11l-1.8 1.3z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M5.2 5.4h4.8M5.2 7.8h4.8" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><circle cx="12.8" cy="4" r="1.2" fill="currentColor"/></svg>`,
  archive: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 4.1h9.6v8.1a1 1 0 0 1-1 1H4.2a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M2.7 4.1h10.6M5.7 2.9h4.6" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M6.4 6.5v4M9.6 6.5v4" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>`,
  restore: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 8A4.8 4.8 0 1 0 8 3.2h-3" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="m3.2 4.6-.9 3 3 .8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 5.4v2.9l2 1.3" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  "chevron-left": `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m9.8 3.6-4 4.4 4 4.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  "chevron-right": `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6.2 3.6 4 4.4-4 4.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  "chevron-down": `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.6 6.2 4.4 4 4.4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

export function createIcon(name: EditorIconName, className = "editor-icon"): HTMLElement {
  const element = createElement("span", className);
  element.dataset.iconName = name;
  element.innerHTML = ICONS[name];
  return element;
}
