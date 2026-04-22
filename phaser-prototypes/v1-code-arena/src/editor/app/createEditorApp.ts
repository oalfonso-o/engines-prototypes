import { EditorDb } from "../storage/editorDb";
import { EditorRepository } from "../storage/editorRepository";
import { ObjectUrlRegistry } from "../storage/objectUrlRegistry";
import { EditorStore } from "../state/EditorStore";
import { EditorRouter } from "./EditorRouter";
import { EditorLayout } from "./EditorLayout";

export async function createEditorApp(root: HTMLElement): Promise<() => Promise<void>> {
  const router = new EditorRouter();
  const db = new EditorDb();
  const repository = new EditorRepository(db);
  const objectUrlRegistry = new ObjectUrlRegistry();
  const store = new EditorStore(repository, router, objectUrlRegistry);
  await store.init();

  const layout = new EditorLayout(root, store);

  return async () => {
    layout.destroy();
    store.destroy();
    router.destroy();
    await repository.close();
  };
}
