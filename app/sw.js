
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => self.clients.claim())

const cacheResponse = async (key, url, res) => {
  const cache = await caches.open(key)
  await cache.put(url, res)
}

const fetchAndupdateCache = async (key, url) => {
  if (!navigator.onLine) return
  const res = await fetch(url)
  cacheResponse(key, url, res.clone())
  return res
}

const respondCacheFirst = async (key, url) => {
  url = url.split('?').shift()
  const cache = await caches.open(key)
  const res = await cache.match(url)
  if (res) {
    fetchAndupdateCache(key, url)
    return res
  }

  console.log('fetch', url)
  const remoteRes = await fetchAndupdateCache(key, url)
  return remoteRes
}

self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'GET') {
    // fall back to network
    return
  }
  const {pathname} = new URL(req.url)

  event.respondWith(async function () {
    // Single Page Request
    if (pathname === '/') {
      return respondCacheFirst('assets', '/index.html')
    }

    // assets
    if (pathname.startsWith('/static/')) {
      return respondCacheFirst('assets', req.url)
    }

    // from network
    return fetch(req.url, {mode: 'no-cors'})
  }())
})
