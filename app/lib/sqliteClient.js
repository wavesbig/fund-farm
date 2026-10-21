/**
 * 前端与本地 Next.js 服务端 SQLite 交互的轻量客户端
 */
import { getStoredToken, removeStoredToken } from './authClient';

function getAuthHeaders(extraHeaders = {}) {
  const headers = { ...extraHeaders };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchSqliteData() {
  try {
    const res = await fetch('/api/sync', {
      method: 'GET',
      headers: getAuthHeaders({ 'Cache-Control': 'no-cache' })
    });

    if (res.status === 401) {
      removeStoredToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
      return null;
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.success ? json : null;
  } catch (err) {
    console.warn('[SQLite Client] Fetch failed:', err);
    return null;
  }
}

export async function saveSqliteData(dataMap) {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ data: dataMap })
    });

    if (res.status === 401) {
      removeStoredToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
      return null;
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.success ? json : null;
  } catch (err) {
    console.error('[SQLite Client] Save failed:', err);
    return null;
  }
}

export async function saveSqliteKey(key, value) {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ key, value })
    });

    if (res.status === 401) {
      removeStoredToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
      return null;
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.success ? json : null;
  } catch (err) {
    console.error('[SQLite Client] Save key failed:', err);
    return null;
  }
}

export async function clearSqliteData() {
  try {
    const res = await fetch('/api/sync', {
      method: 'DELETE',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ clear: true })
    });

    if (res.status === 401) {
      removeStoredToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
      return false;
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.success;
  } catch (err) {
    console.error('[SQLite Client] Clear failed:', err);
    return false;
  }
}
