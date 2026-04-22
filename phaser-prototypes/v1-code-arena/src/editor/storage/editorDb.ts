import type {
  AnimationDefinition,
  CharacterDefinition,
  MapDefinition,
  RawAssetBlobRecord,
  RawAssetRecord,
  SpriteSheetDefinition,
  TilesetDefinition,
} from "../domain/editorTypes";

export type EditorStoreName =
  | "rawAssets"
  | "rawAssetBlobs"
  | "tilesets"
  | "spritesheets"
  | "animations"
  | "characters"
  | "maps"
  | "meta";

interface MetaRecord {
  id: string;
  value: string;
}

interface EditorStoreMap {
  rawAssets: RawAssetRecord;
  rawAssetBlobs: RawAssetBlobRecord;
  tilesets: TilesetDefinition;
  spritesheets: SpriteSheetDefinition;
  animations: AnimationDefinition;
  characters: CharacterDefinition;
  maps: MapDefinition;
  meta: MetaRecord;
}

const DB_NAME = "canuter-phaser-v1-editor";
const DB_VERSION = 1;

export class EditorDb {
  private databasePromise: Promise<IDBDatabase> | null = null;

  async getAll<TStore extends EditorStoreName>(storeName: TStore): Promise<Array<EditorStoreMap[TStore]>> {
    const database = await this.open();
    const transaction = database.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const result = await requestToPromise(store.getAll()) as Array<EditorStoreMap[TStore]>;
    await transactionComplete(transaction);
    return result;
  }

  async get<TStore extends EditorStoreName>(
    storeName: TStore,
    id: string,
  ): Promise<EditorStoreMap[TStore] | null> {
    const database = await this.open();
    const transaction = database.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const result = await requestToPromise(store.get(id)) as EditorStoreMap[TStore] | undefined;
    await transactionComplete(transaction);
    return result ?? null;
  }

  async put<TStore extends EditorStoreName>(storeName: TStore, value: EditorStoreMap[TStore]): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    store.put(value);
    await transactionComplete(transaction);
  }

  async close(): Promise<void> {
    if (!this.databasePromise) {
      return;
    }

    const database = await this.databasePromise;
    database.close();
    this.databasePromise = null;
  }

  private open(): Promise<IDBDatabase> {
    if (!this.databasePromise) {
      this.databasePromise = openDatabase();
    }

    return this.databasePromise;
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      createStoreIfMissing(database, "rawAssets");
      createStoreIfMissing(database, "rawAssetBlobs");
      createStoreIfMissing(database, "tilesets");
      createStoreIfMissing(database, "spritesheets");
      createStoreIfMissing(database, "animations");
      createStoreIfMissing(database, "characters");
      createStoreIfMissing(database, "maps");
      createStoreIfMissing(database, "meta");
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("No se pudo abrir IndexedDB"));
    };
  });
}

function createStoreIfMissing(database: IDBDatabase, storeName: EditorStoreName): void {
  if (!database.objectStoreNames.contains(storeName)) {
    database.createObjectStore(storeName, { keyPath: "id" });
  }
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}
