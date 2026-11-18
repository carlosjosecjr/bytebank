import { Injectable, InjectionToken, inject } from '@angular/core';

/** Onde a chave AES fica guardada. A chave é um CryptoKey NÃO exportável:
 * o IndexedDB guarda o objeto, mas nem o próprio JS consegue ler os bytes dela. */
export interface KeyStore {
  load(): Promise<CryptoKey | null>;
  save(key: CryptoKey): Promise<void>;
  remove(): Promise<void>;
}

const DB_NAME = 'bytebank-secure';
const STORE = 'keys';
const KEY_ID = 'storage-key';

@Injectable({ providedIn: 'root' })
export class IndexedDbKeyStore implements KeyStore {
  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async run<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest): Promise<T> {
    const db = await this.open();
    try {
      return await new Promise<T>((resolve, reject) => {
        const request = op(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => resolve(request.result as T);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  }

  async load(): Promise<CryptoKey | null> {
    return (await this.run<CryptoKey | undefined>('readonly', (s) => s.get(KEY_ID))) ?? null;
  }

  async save(key: CryptoKey): Promise<void> {
    await this.run('readwrite', (s) => s.put(key, KEY_ID));
  }

  async remove(): Promise<void> {
    await this.run('readwrite', (s) => s.delete(KEY_ID));
  }
}

export const KEY_STORE = new InjectionToken<KeyStore>('KEY_STORE', {
  providedIn: 'root',
  factory: () => inject(IndexedDbKeyStore),
});
