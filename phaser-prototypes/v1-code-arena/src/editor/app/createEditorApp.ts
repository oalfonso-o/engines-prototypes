import type { i18n as I18nInstance } from "i18next";
import { EditorDb } from "../storage/editorDb";
import { EditorRepository } from "../storage/editorRepository";
import { ObjectUrlRegistry } from "../storage/objectUrlRegistry";
import { EditorStore } from "../state/EditorStore";
import { EditorRouter, type EditorRouteController } from "./EditorRouter";
import { EditorLayout } from "./EditorLayout";
import { EditorTranslator } from "../i18n/EditorTranslator";
import { bootstrapEditorData } from "../bootstrap/bootstrapEditorData";

export interface CreateEditorAppOptions {
  i18n: I18nInstance;
  router?: EditorRouteController;
  onReturnToMainMenu?: () => void;
}

export async function createEditorApp(root: HTMLElement, options: CreateEditorAppOptions): Promise<() => Promise<void>> {
  const router = options.router ?? new EditorRouter();
  const db = new EditorDb();
  const repository = new EditorRepository(db);
  const objectUrlRegistry = new ObjectUrlRegistry();
  const store = new EditorStore(repository, router, objectUrlRegistry);
  const translator = new EditorTranslator(options.i18n);
  await bootstrapEditorData(repository);
  await store.init();

  const layout = new EditorLayout(root, store, {
    translator,
    onReturnToMainMenu: options.onReturnToMainMenu,
  });

  return async () => {
    layout.destroy();
    store.destroy();
    router.destroy();
    await repository.close();
  };
}
