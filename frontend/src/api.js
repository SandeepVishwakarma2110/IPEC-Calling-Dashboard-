export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');
  const r = await fetch('/api' + path, {
    method, body: body && JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) },
  });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && token && !path.startsWith('/auth/login')) { localStorage.clear(); location.href = '/login'; }
  if (!r.ok) throw new Error(d.message || 'Something went wrong. Please try again.');
  return d;
}

export async function apiBlob(path) {
  const token = localStorage.getItem('token');
  const r = await fetch(path, {
    headers: token ? { Authorization: 'Bearer ' + token } : {},
  });
  const d = r.ok ? null : await r.json().catch(() => ({}));
  if (r.status === 401 && token) { localStorage.clear(); location.href = '/login'; }
  if (!r.ok) throw new Error(d?.message || 'Something went wrong. Please try again.');
  return r.blob();
}
