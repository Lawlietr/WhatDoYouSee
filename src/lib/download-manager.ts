import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "they-see-your-photo";
const STORE_NAME = "models";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
  return dbPromise;
}

export async function hasModel(modelId: string): Promise<boolean> {
  const db = await getDB();
  const entry = (await db.get(STORE_NAME, modelId)) as
    | { bytes: ArrayBuffer }
    | undefined;
  return entry != null;
}

export interface DownloadResult {
  bytes: ArrayBuffer;
}

export async function downloadModel(
  modelId: string,
  url: string,
  onProgress: (loaded: number, total: number) => void,
  signal?: AbortSignal
): Promise<DownloadResult> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  const total = Number(response.headers.get("content-length") ?? 0);
  if (!response.body) {
    const bytes = await response.arrayBuffer();
    onProgress(bytes.byteLength, total || bytes.byteLength);
    await putModel(modelId, bytes);
    return { bytes };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onProgress(loaded, total);
  }
  const bytes = new ArrayBuffer(loaded);
  const view = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    view.set(chunk, offset);
    offset += chunk.byteLength;
  }
  await putModel(modelId, bytes);
  return { bytes };
}

async function putModel(modelId: string, bytes: ArrayBuffer): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, { bytes }, modelId);
}

export async function getModelBytes(modelId: string): Promise<ArrayBuffer | null> {
  const db = await getDB();
  const entry = (await db.get(STORE_NAME, modelId)) as
    | { bytes: ArrayBuffer }
    | undefined;
  return entry?.bytes ?? null;
}

export async function deleteModel(modelId: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, modelId);
}

export async function clearModelCache(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

export async function cachedModelBytes(): Promise<number> {
  const db = await getDB();
  let total = 0;
  const keys = await db.getAllKeys(STORE_NAME);
  for (const key of keys) {
    const entry = (await db.get(STORE_NAME, key as string)) as
      | { bytes: ArrayBuffer }
      | undefined;
    if (entry) total += entry.bytes.byteLength;
  }
  return total;
}
