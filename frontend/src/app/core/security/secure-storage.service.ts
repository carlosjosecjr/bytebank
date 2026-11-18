import { Injectable, inject } from '@angular/core';
import { KEY_STORE } from './key-store';

const PREFIX = 'bb.secure.';
const IV_BYTES = 12;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Armazenamento cifrado (AES-GCM 256) para dados sensíveis em repouso: perfil do usuário e
 * snapshot do extrato, usados para abrir a tela na hora (stale-while-revalidate).
 * - IV aleatório por gravação; o GCM também autentica (dado adulterado não decifra).
 * - Chave não exportável no IndexedDB; o localStorage só contém ciphertext.
 * - Sem Web Crypto (contexto não seguro), simplesmente não persiste nada.
 */
@Injectable({ providedIn: 'root' })
export class SecureStorage {
  private readonly keyStore = inject(KEY_STORE);
  private keyPromise: Promise<CryptoKey> | null = null;

  private get available(): boolean {
    return typeof crypto !== 'undefined' && !!crypto.subtle && typeof localStorage !== 'undefined';
  }

  private key(): Promise<CryptoKey> {
    this.keyPromise ??= (async () => {
      const existing = await this.keyStore.load();
      if (existing) return existing;
      const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
        'encrypt',
        'decrypt',
      ]);
      await this.keyStore.save(key);
      return key;
    })();
    this.keyPromise.catch(() => (this.keyPromise = null));
    return this.keyPromise;
  }

  async setItem<T>(name: string, value: T): Promise<void> {
    if (!this.available) return;
    try {
      const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
      const plain = new TextEncoder().encode(JSON.stringify(value));
      const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await this.key(), plain);
      localStorage.setItem(PREFIX + name, `${toBase64(iv)}.${toBase64(new Uint8Array(cipher))}`);
    } catch {
      /* armazenamento é só otimização: falha silenciosa */
    }
  }

  async getItem<T>(name: string): Promise<T | null> {
    if (!this.available) return null;
    try {
      const stored = localStorage.getItem(PREFIX + name);
      if (!stored) return null;
      const [iv, cipher] = stored.split('.');
      const plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: fromBase64(iv) },
        await this.key(),
        fromBase64(cipher),
      );
      return JSON.parse(new TextDecoder().decode(plain)) as T;
    } catch {
      this.removeItem(name); // chave trocada ou dado adulterado
      return null;
    }
  }

  removeItem(name: string): void {
    try {
      localStorage.removeItem(PREFIX + name);
    } catch {
      /* ignore */
    }
  }

  /** Logout: apaga os dados cifrados e descarta a chave. */
  async clear(): Promise<void> {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
      this.keyPromise = null;
      await this.keyStore.remove();
    } catch {
      /* ignore */
    }
  }
}
