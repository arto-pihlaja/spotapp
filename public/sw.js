importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');

workbox.setConfig({ debug: false });

const { registerRoute, NavigationRoute, setDefaultHandler } = workbox.routing;
const { NetworkFirst, CacheFirst, StaleWhileRevalidate } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { precacheAndRoute } = workbox.precaching;

// Activate immediately
self.skipWaiting();
self.addEventListener('activate', () => self.clients.claim());

// HTML navigation — NetworkFirst, 24h cache
const navigationStrategy = new NetworkFirst({
  cacheName: 'html-cache',
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 }),
  ],
});

const navigationRoute = new NavigationRoute(navigationStrategy);
registerRoute(navigationRoute);

// Static JS/CSS bundles (_expo/static/*) — CacheFirst, 30 days
registerRoute(
  ({ url }) => url.pathname.startsWith('/_expo/static/'),
  new CacheFirst({
    cacheName: 'static-bundles',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
);

// Images — CacheFirst, 7 days
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 7,
      }),
    ],
  })
);

// API: /api/v1/spots — StaleWhileRevalidate, 1h
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/v1/spots') && request.method === 'GET',
  new StaleWhileRevalidate({
    cacheName: 'api-spots',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxAgeSeconds: 60 * 60 }),
    ],
  })
);

// Other API GETs — NetworkFirst, 1h
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/') && request.method === 'GET',
  new NetworkFirst({
    cacheName: 'api-other',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxAgeSeconds: 60 * 60 }),
    ],
  })
);
