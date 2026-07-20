const DATABASE_NAME = "auxiliaire-audio";
const STORE_NAME = "recordings";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAudio(id: string, blob: Blob): Promise<string> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(blob, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
  return `indexeddb:${id}`;
}

export async function loadAudio(url: string): Promise<string | null> {
  if (!url.startsWith("indexeddb:")) return url;
  const blob = await loadAudioBlob(url);
  return blob ? URL.createObjectURL(blob) : null;
}

export async function loadAudioBlob(url: string): Promise<Blob | null> {
  if (!url.startsWith("indexeddb:")) {
    const response = await fetch(url);
    return response.ok ? response.blob() : null;
  }
  const database = await openDatabase();
  const id = url.slice("indexeddb:".length);
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result as Blob | undefined);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return blob ?? null;
}

export async function deleteAudio(url?: string) {
  if (!url?.startsWith("indexeddb:")) return;
  const database = await openDatabase();
  const id = url.slice("indexeddb:".length);
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}
