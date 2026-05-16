import { API_BASE } from './apiConfig';

const normalizeUrl = (inputUrl) => {
  if (!inputUrl) return API_BASE;
  if (/^https?:\/\//i.test(inputUrl)) return inputUrl;

  const base = (API_BASE || '').replace(/\/$/, '');
  let path = `${inputUrl}`;

  // If the path begins with /api and API_BASE already ends with /api, drop the prefix to avoid /api/api
  if (/^\/api\b/.test(path) && /\/api\/?$/.test(base)) {
    path = path.replace(/^\/api/, '');
  }

  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  return `${base}${path}`;
};

const getAuthHeaders = () => {
  // Relying on browser session cookies (JSESSIONID) instead of localstorage tokens
  return {};
};

const handleRedirects = (status) => {
  if (typeof window === 'undefined') return;
  if (status === 401) {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    } catch (_) { }
    window.location.href = '/login';
  } else if (status === 403) {
    // console.warn('Access forbidden - session might be invalid or role unauthorized');
    // window.location.href = '/unauthorized';
  }
};

const parseResponse = async (res, expectBlob = false) => {
  const contentType = res.headers.get('content-type') || '';
  if (expectBlob) {
    const data = await res.blob();
    return { data };
  }
  if (contentType.includes('application/json')) {
    const text = await res.text();
    if (!text) return { data: null };
    try {
      const data = JSON.parse(text);
      return { data };
    } catch (e) {
      console.error('JSON parse error on:', text);
      return { data: text };
    }
  }
  const text = await res.text();
  return { data: text };
};

const request = async (method, url, options = {}) => {
  const { headers = {}, params, body, expectBlob = false, credentials } = options;

  let finalUrl = normalizeUrl(url);
  if (params && typeof params === 'object') {
    const usp = new URLSearchParams(params);
    const sep = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${sep}${usp.toString()}`;
  }

  const init = { method, headers: { ...getAuthHeaders(), ...headers } };

  // Preserve HOD-specific headers that were previously set in axios interceptors
  const hodPathRegex = /\/hod\//i;
  if ((typeof url === 'string' && hodPathRegex.test(url)) || hodPathRegex.test(finalUrl)) {
    if (!init.headers['X-User-Role']) init.headers['X-User-Role'] = 'HOD';
    if (!init.headers['X-Request-Source']) init.headers['X-Request-Source'] = 'HOD-Dashboard';
  }

  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      init.body = body; // Let the browser set proper multipart boundary
    } else if (typeof body === 'string') {
      init.body = body;
      if (!init.headers['Content-Type']) {
        init.headers['Content-Type'] = 'application/json';
      }
    } else {
      init.body = JSON.stringify(body);
      if (!init.headers['Content-Type']) {
        init.headers['Content-Type'] = 'application/json';
      }
    }
  }

  // Default to include credentials so session cookies are sent
  init.credentials = credentials || 'include';

  const res = await fetch(finalUrl, init);
  const { data } = await parseResponse(res, expectBlob);

  if (!res.ok) {
    handleRedirects(res.status);
    const error = new Error((data && (data.message || data.error)) || `Request failed with status ${res.status}`);
    error.response = { status: res.status, data };
    throw error;
  }

  return {
    data,
    status: res.status,
    headers: res.headers,
    url: finalUrl,
  };
};

export const get = (url, options = {}) => request('GET', url, options);
export const post = (url, body, options = {}) => request('POST', url, { ...options, body });
export const put = (url, body, options = {}) => request('PUT', url, { ...options, body });
export const patch = (url, body, options = {}) => request('PATCH', url, { ...options, body });
export const del = (url, options = {}) => request('DELETE', url, options);

const http = { get, post, put, patch, del };
export default http;


