import { TestBed } from '@angular/core/testing';
import { KEY_STORE, KeyStore } from './key-store';
import { SecureStorage } from './secure-storage.service';

class MemoryKeyStore implements KeyStore {
  key: CryptoKey | null = null;
  async load() { return this.key; }
  async save(key: CryptoKey) { this.key = key; }
  async remove() { this.key = null; }
}

describe('SecureStorage', () => {
  let storage: SecureStorage;
  let keys: MemoryKeyStore;

  beforeEach(() => {
    localStorage.clear();
    keys = new MemoryKeyStore();
    TestBed.configureTestingModule({ providers: [{ provide: KEY_STORE, useValue: keys }] });
    storage = TestBed.inject(SecureStorage);
  });

  it('grava cifrado e lê de volta', async () => {
    await storage.setItem('perfil', { name: 'Joana', email: 'joana@bytebank.com' });

    const raw = localStorage.getItem('bb.secure.perfil')!;
    expect(raw).toBeTruthy();
    expect(raw).not.toContain('Joana');
    expect(raw).not.toContain('joana@bytebank.com');
    expect(keys.key?.extractable).toBe(false);

    expect(await storage.getItem('perfil')).toEqual({ name: 'Joana', email: 'joana@bytebank.com' });
  });

  it('usa IV novo a cada gravação', async () => {
    await storage.setItem('x', 'mesmo valor');
    const a = localStorage.getItem('bb.secure.x');
    await storage.setItem('x', 'mesmo valor');
    expect(localStorage.getItem('bb.secure.x')).not.toBe(a);
  });

  it('descarta dado adulterado', async () => {
    await storage.setItem('x', { saldo: 100 });
    const [iv, cipher] = localStorage.getItem('bb.secure.x')!.split('.');
    const tampered = cipher.slice(0, -4) + (cipher.endsWith('AAAA') ? 'BBBB' : 'AAAA');
    localStorage.setItem('bb.secure.x', `${iv}.${tampered}`);
    expect(await storage.getItem('x')).toBeNull();
    expect(localStorage.getItem('bb.secure.x')).toBeNull();
  });

  it('clear apaga os dados e a chave', async () => {
    await storage.setItem('x', 1);
    localStorage.setItem('outra-coisa', 'fica');
    await storage.clear();
    expect(localStorage.getItem('bb.secure.x')).toBeNull();
    expect(localStorage.getItem('outra-coisa')).toBe('fica');
    expect(keys.key).toBeNull();
  });
});
