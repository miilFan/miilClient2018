import * as Comlink from 'https://cdn.jsdelivr.net/npm/comlinkjs@3/comlink.js'

Polymer('miil-client', {
  ready: function() {
    g = this.shadowRoot.querySelector("griddle-cards");
    m = this;
    ms = this.shadowRoot;
  }
});

const clearCache = async key => {
  const keys = await caches.keys()
  return Promise.all(keys
    .filter(_key => _key === key)
    .map(_key => caches.delete(_key)))
}

const getRegistration = async () => {
  const {serviceWorker} = navigator
  return serviceWorker && serviceWorker.getRegistration('/')
}

window.cacheMiilImages = async urls => {
  const {serviceWorker} = navigator
  const {port1, port2} = new MessageChannel()
  const msg = {
    task: 'cache-miil-images',
    urls,
    port: port1
  }
  serviceWorker.controller.postMessage(msg, [port1])
  const swProxy = Comlink.proxy(port2)
  return swProxy.res
}

const enableServiceWorker = () => {
  const {serviceWorker} = navigator
  if (!serviceWorker) return

  serviceWorker.addEventListener('controllerchange', async () => {
    // この方法だと、sw clientでエラーが出た場合、swを更新するしか修復手段がない
    // controllerchangeリスナーも壊れていたらこれも通用しない？
    console.log('sw controller changed')
    await clearCache('assets')
  })

  if (getRegistration()) return
  serviceWorker.register('/sw.js', {scope: '/'})
}

enableServiceWorker()
