export const environment = {
  production: false,
  // Dev calls go same-origin and are proxied to the backend (proxy.conf.json),
  // avoiding CORS. The backend runs locally on :5000.
  apiBaseUrl: '/api/v1',
};
