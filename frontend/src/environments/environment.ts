// src/environments/environment.ts  (development)
export const environment = {
  production: false,
  // All modules point to the same backend — easy to split per-service later
  apiBaseUrl: 'http://localhost:5000/api',
  subdomainSuffix: '.pasal-e.me'
};
