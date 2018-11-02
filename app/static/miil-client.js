Polymer('miil-client', {
  ready: function() {
    g = this.shadowRoot.querySelector("griddle-cards");
    m = this;
    ms = this.shadowRoot;
  }
});

const enableServiceWorker = () => {
  const {serviceWorker} = navigator
  if (!serviceWorker) return

  serviceWorker.addEventListener('controllerchange', () => {
    console.log('sw controller changed')
  })
  serviceWorker.register('/sw.js', {scope: '/'})
}

enableServiceWorker()
