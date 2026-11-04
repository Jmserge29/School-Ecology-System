// =========================================================
// ROUTER (hash)
// Rutas con la forma  #/<modulo>/<subruta>?param=valor
//   #/ventas            → módulo "ventas"
//   #/ventas/soportes   → módulo "ventas", sub = "soportes"
// Funciona en cualquier hosting estático sin configuración extra.
// =========================================================
export function parseHash(hash = location.hash) {
  const raw = hash.replace(/^#\/?/, '');
  const [pathPart = '', queryPart = ''] = raw.split('?');
  const segments = pathPart.split('/').filter(Boolean).map(decodeURIComponent);
  return {
    path: segments[0] || '',
    sub: segments[1] || '',
    segments,
    query: Object.fromEntries(new URLSearchParams(queryPart)),
  };
}

export function navigate(path) {
  const target = '#/' + String(path).replace(/^#?\/?/, '');
  if (location.hash === target) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = target;
}

export function startRouter(handler) {
  window.addEventListener('hashchange', () => handler(parseHash()));
  handler(parseHash());
}
