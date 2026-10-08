import axios from 'axios';

// Environment-based API Base URL (VITE_API_BASE_URL is set in .env or Render dashboard)
const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8081/api';

// Strip any trailing slash so subpaths like '/students' or '/auth/login' concatenate cleanly without duplicate slashes
const baseURL = rawBaseUrl.replace(/\/+$/, '');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add JWT Bearer token, correlation trace ID, and outgoing request logs
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('svbh_token') || localStorage.getItem('svbh_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach unique correlation trace ID to link frontend actions with backend logs
    const traceId = 'fe_' + Math.random().toString(36).substring(2, 10);
    config.headers['X-Trace-Id'] = traceId;
    (config as any).metadata = { startTime: Date.now(), traceId };

    const method = config.method?.toUpperCase() || 'GET';
    const payload = config.data ? config.data : config.params ? config.params : '';
    console.debug(
      `%c[API >>>] %c${method} %c${config.url} %c[${traceId}]`,
      'color: #3b82f6; font-weight: bold;',
      'color: #f59e0b; font-weight: bold;',
      'color: #38bdf8;',
      'color: #94a3b8; font-size: 11px;',
      payload
    );

    return config;
  },
  (error) => {
    console.error('%c[API Request Init Failed]', 'color: #ef4444; font-weight: bold;', error);
    return Promise.reject(error);
  }
);

// Response interceptor: log success/latency, handle 401 unauthorized, and log errors
api.interceptors.response.use(
  (response) => {
    const meta = (response.config as any)?.metadata;
    const duration = meta?.startTime ? Date.now() - meta.startTime : 0;
    const traceId = response.headers['x-trace-id'] || meta?.traceId || '-';

    console.debug(
      `%c[API <<<] %c${response.status} %c${response.config.url} %c(${duration}ms, trace: ${traceId})`,
      'color: #10b981; font-weight: bold;',
      'color: #34d399; font-weight: bold;',
      'color: #e2e8f0;',
      'color: #94a3b8; font-size: 11px;',
      response.data
    );

    return response;
  },
  (error) => {
    const meta = (error.config as any)?.metadata;
    const duration = meta?.startTime ? Date.now() - meta.startTime : 0;
    const traceId = error.response?.headers?.['x-trace-id'] || meta?.traceId || '-';
    const status = error.response?.status || 'NETWORK_ERR';
    const errorBody = error.response?.data || error.message;

    console.error(
      `%c[API ERR] %c${status} %c${error.config?.url || 'UNKNOWN'} %c(${duration}ms, trace: ${traceId})`,
      'color: #ef4444; font-weight: bold;',
      'color: #f87171; font-weight: bold;',
      'color: #fca5a5;',
      'color: #94a3b8; font-size: 11px;',
      errorBody
    );

    if (error.response && error.response.status === 401) {
      // If unauthorized and not already on login page, clear token and redirect
      if (window.location.pathname !== '/login') {
        sessionStorage.removeItem('svbh_token');
        sessionStorage.removeItem('svbh_user');
        localStorage.removeItem('svbh_token');
        localStorage.removeItem('svbh_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
