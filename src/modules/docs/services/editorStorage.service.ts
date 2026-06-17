// Service managing IndexedDB storage of Yjs updates for offline document editing,
// caches edits securely on browser and syncs back to server on reconnection,
// provides methods to save, retrieve, and delete updates to maintain chronologically consistent state.
"use client";

export interface PendingYjsUpdate {
  id: string;
  documentId: string;
  update: Uint8Array;
  createdAt: number;
}

const DB_NAME = "TiptapEditorOfflineDB";
const STORE_NAME = "pendingUpdates";
const DB_VERSION = 1;

const generateUUID = (): string => {
  if (typeof window !== "undefined" && window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

class EditorStorageService {
  private db: IDBDatabase | null = null;

  private initDB(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);

    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.indexedDB) {
        reject(new Error("IndexedDB is not supported in this environment."));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(request.error || new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      request.onupgradeneeded = (_event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("documentId", "documentId", { unique: false });
        }
      };
    });
  }

  /**
   * Save a local Yjs binary update to IndexedDB.
   * Returns the generated unique ID (UUID) for this update.
   */
  public async saveUpdate(documentId: string, update: Uint8Array): Promise<string> {
    const db = await this.initDB();
    const id = generateUUID();
    const item: PendingYjsUpdate = {
      id,
      documentId,
      update: new Uint8Array(update), // Clone the buffer to ensure preservation
      createdAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(item);

      request.onsuccess = () => {
        resolve(id);
      };

      request.onerror = () => {
        reject(request.error || new Error("Failed to save update to IndexedDB"));
      };
    });
  }

  /**
   * Get all pending updates for a specific document, ordered by createdAt ascending.
   */
  public async getPendingUpdates(documentId: string): Promise<PendingYjsUpdate[]> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("documentId");
      const request = index.getAll(IDBKeyRange.only(documentId));

      request.onsuccess = () => {
        const results = (request.result as PendingYjsUpdate[]) || [];
        // Sort ascending by creation time to preserve chronological order
        results.sort((a, b) => a.createdAt - b.createdAt);
        resolve(results);
      };

      request.onerror = () => {
        reject(request.error || new Error("Failed to read updates from IndexedDB"));
      };
    });
  }

  /**
   * Remove a specific update from IndexedDB by its unique ID.
   */
  public async removeUpdate(id: string): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error || new Error("Failed to remove update from IndexedDB"));
      };
    });
  }

  /**
   * Clear all pending updates for a specific document.
   */
  public async clearUpdatesForDocument(documentId: string): Promise<void> {
    const updates = await this.getPendingUpdates(documentId);
    if (updates.length === 0) return;

    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      for (const item of updates) {
        store.delete(item.id);
      }

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error || new Error("Failed to clear updates for document"));
      };
    });
  }
}

export const editorStorageService = new EditorStorageService();
