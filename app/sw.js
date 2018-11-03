
importScripts('https://cdn.jsdelivr.net/npm/comlinkjs@3/umd/comlink.js')

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => self.clients.claim())

self.addEventListener('message', async event => {
  const {task, port} = event.data
  let res
  switch (task) {
    case 'cache-miil-images': {
      const {urls} = event.data
      res = await cacheMiilImages(urls)
    }
  }
  Comlink.expose({res}, port)
})

const cacheMiilImages = async urls => {
  if (urls.length === 0) return null
  const cache = await caches.open('miil-images')
  await cache.addAll(urls)
  return urls
}

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
  const {pathname, host} = new URL(req.url)
  if (req.method !== 'GET') {
    // fall back to network
    return
  }

  event.respondWith(async function () {
    // Single Page Request
    if (pathname === '/') {
      return respondCacheFirst('assets', '/index.html')
    }

    // assets
    if (pathname.startsWith('/static/') || host.indexOf('cdn.') >= 0) {
      return respondCacheFirst('assets', req.url)
    }

    // from network
    return fetch(req.url, {mode: 'no-cors'})
  }())
})
