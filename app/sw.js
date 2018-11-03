
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => self.clients.claim())

const parseUrl = url => {
  let toks = url.split('//')
  const protocol = toks[0]
  toks = toks[1].split('/')
  const host = toks.shift()
  const pathname = `/${toks.join('/')}`.split('?')[0]
  return {protocol, host, pathname}
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
  const cache = await caches.open(key)
  const res = await cache.match(url.split('?').shift())
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
  if (req.method !== 'GET') return
  const {pathname} = parseUrl(req.url)

  if (pathname.startsWith('/static/') || pathname === '/') {
    return respondCacheFirst('assets', req.url)
  }
  return
})

// controller changeしたらcache全部クリア
// windowサイズ？
