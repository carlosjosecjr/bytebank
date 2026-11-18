import { safeReturnUrl } from './safe-return-url';

describe('safeReturnUrl', () => {
  it('aceita só caminhos internos', () => {
    expect(safeReturnUrl('/minha-conta')).toBe('/minha-conta');
    expect(safeReturnUrl('//evil.com')).toBe('/inicio');
    expect(safeReturnUrl('https://evil.com')).toBe('/inicio');
    expect(safeReturnUrl('/\\evil.com')).toBe('/inicio');
    expect(safeReturnUrl('/login')).toBe('/inicio');
    expect(safeReturnUrl(undefined)).toBe('/inicio');
  });
});
