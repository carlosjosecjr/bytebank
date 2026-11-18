/** Evita open redirect: só aceita caminhos internos ("/algo", nunca "//host" ou "https://"). */
export function safeReturnUrl(url: string | undefined | null, fallback = '/inicio'): string {
  if (!url || !url.startsWith('/') || url.startsWith('//') || url.startsWith('/\\')) return fallback;
  if (url.startsWith('/login') || url.startsWith('/cadastro')) return fallback;
  return url;
}
