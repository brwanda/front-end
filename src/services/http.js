import { API_BASE } from './apiConfig';

const normalizeUrl = (inputUrl) => {
  if (!inputUrl) return API_BASE;
  if (/^https?:\/\//i.test(inputUrl)) return inputUrl;

  const base = (API_BASE || '').replace(/\/$/, '');
  let path = `${inputUrl}`;

  if (/^\/api\b/.test(path) && /\/api\/?$/.test(base)) {
    path = path.replace(/^\/api/, '');
  }

  if (!path.startsWith('/')) path = `/${path}`;

  return `${base}${path}`;
};

// ─── Token helpers ────────────────────────────────────────────────────────────
const TOKEN_KEY = 'authToken';

export const saveToken  = (token) => { try { localStorage.setItem(TOKEN_KEY, token); } catch (_) {} };
export const getToken   = ()      => { try { return localStorage.getItem(TOKEN_KEY); } catch (_) { return null; } };
export const clearToken = ()      => { try { localStorage.removeItem(TOKEN_KEY); }     catch (_) {} };

const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Auth endpoints — 401 on these should NOT redirect to /login
const AUTH_ENDPOINTS = ['/auth/login', '/auth/logout', '/auth/refresh', '/forgot-password', '/reset-password'];
const isAuthEndpoint = (url = '') => AUTH_ENDPOINTS.some((ep) => url.includes(ep));

const handleRedirects = (status, url = '') => {
  if (typeof window === 'undefined') return;

  if (status === 401 && !isAuthEndpoint(url)) {
    clearToken();
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('lastActivity');
    } catch (_) {}

    const current = window.location.pathname;
    if (current !== '/login') {
      window.location.href = `/login?redirect=${encodeURIComponent(current)}`;
    }
  }
};

const parseResponse = async (res, expectBlob = false) => {
  const contentType = res.headers.get('content-type') || '';
  if (expectBlob) return { data: await res.blob() };
  if (contentType.includes('application/json')) {
    const text = await res.text();
    if (!text) return { data: null };
    try { return { data: JSON.parse(text) }; }
    catch (e) { console.error('JSON parse error:', text); return { data: text }; }
  }
  return { data: await res.text() };
};

const request = async (method, url, options = {}) => {
  const { headers = {}, params, body, expectBlob = false } = options;

  let finalUrl = normalizeUrl(url);
  if (params && typeof params === 'object') {
    const usp = new URLSearchParams(params);
    finalUrl += `${finalUrl.includes('?') ? '&' : '?'}${usp.toString()}`;
  }

  const init = {
    method,
    headers: { ...getAuthHeaders(), ...headers },
    // 'same-origin' instead of 'include' — cross-origin session cookies between
    // Vercel (frontend) and Railway (backend) are blocked by browsers.
    // Auth is now handled via Authorization: Bearer <token> header.
    credentials: 'same-origin',
  };

  // HOD-specific headers
  const hodPathRegex = /\/hod\//i;
  if (hodPathRegex.test(url) || hodPathRegex.test(finalUrl)) {
    if (!init.headers['X-User-Role'])      init.headers['X-User-Role']      = 'HOD';
    if (!init.headers['X-Request-Source']) init.headers['X-Request-Source'] = 'HOD-Dashboard';
  }

  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      init.body = body;
    } else {
      init.body = JSON.stringify(body);
      if (!init.headers['Content-Type']) init.headers['Content-Type'] = 'application/json';
    }
  }

  const res = await fetch(finalUrl, init);
  const { data } = await parseResponse(res, expectBlob);

  if (!res.ok) {
    handleRedirects(res.status, finalUrl);
    const error = new Error(
      (data && (data.message || data.error)) || `Request failed with status ${res.status}`
    );
    error.response = { status: res.status, data };
    throw error;
  }

  return { data, status: res.status, headers: res.headers, url: finalUrl };
};

export const get   = (url, options = {})       => request('GET',    url, options);
export const post  = (url, body, options = {}) => request('POST',   url, { ...options, body });
export const put   = (url, body, options = {}) => request('PUT',    url, { ...options, body });
export const patch = (url, body, options = {}) => request('PATCH',  url, { ...options, body });
export const del   = (url, options = {})       => request('DELETE', url, options);

const http = { get, post, put, patch, del };
export default http;