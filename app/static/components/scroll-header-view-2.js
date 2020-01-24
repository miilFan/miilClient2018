const headerHeight = 192
const headerBackgroundColorDefault = 'transparent'

const headerBackgroundImageHeight = 192
const headerBackgroundColor = '#312319'
const titleHeight = 64
const menusHeight = 40
const grad = true

// ひっかかり
const stickyY = 20

const getStyle = (headerHeight, headerBackgroundColorDefault) => {
  const t = document.createElement('template')
  t.innerHTML = `
    <style>
      #header {
        position: relative;
        background: #eee;
        width: 100%;
        height: ${headerHeight}px;
        z-index: 700;
      }
      #grad, #image {
        position: absolute;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: ${headerBackgroundColor};
        opacity: 0;
      }
      #image {
        opacity: 1;
        padding-bottom: ${headerHeight - (headerBackgroundImageHeight || headerHeight)}px;
        box-sizing: border-box;
      }
      #image > .background-image {
        height: 100%;
        background-image: url("/static/daiiz-photo-wide.jpg");
        background-size: cover;
        background-position: center center;
      }
      #menus {
        user-select: none;
        position: absolute;
        top: 0;
        margin-top: 12px;
        width: 100%;
        height: ${menusHeight}px;
        z-index: 900;
      }
      #icon {
        position: absolute;
        left: 18px;
      }
      #title {
        background-color: ${headerBackgroundColorDefault};
        position: absolute;
        bottom: 0;
        width: 100%;
        height: ${titleHeight}px;
        z-index: 800;
      }
      #contents {
        position: absolute;
        top: 0;
        width: 100%;
        height: calc(100% - ${headerHeight}px);
        overflow: auto;
        padding-top: ${headerHeight}px;
        z-index: 500;
      }
      .tail {
        visibility: hidden;
        width: 100%;
        height: 2px;
        background-color: #555;
      }
    </style>
  `
  return t
}

const getTemplate = () => {
  const t = document.createElement('template')
  t.innerHTML = `
    <div id='scroll-header-view'>
      <div id='header'>
        <div id='image'>
          <div class='background-image'></div>
        </div>
        <div id='grad'></div>
        <div id='menus'>
          <div id="icon">
            <slot name='icon'></slot>
          </div>
          <slot name='menus'></slot>
        </div>
        <div id='title'>
          <slot name='title'></slot>
        </div>
      </div>
      <div id='contents'>
        <slot name='contents'></slot>
        <div class='tail'></div>
      </div>
    </div>
  `
  return t
}

class ScrollHeaderView extends HTMLElement {
  constructor () {
    super()
    this.render()
    this.lastPosY = 0
    this.solid = false
  }

  static get observedAttributes () { return ['solid'] }

  get headerHeight () {
    return this.solid ? headerHeight + titleHeight : headerHeight
  }

  get headerBackgroundColorDefault () {
    return this.solid ? headerBackgroundColor : 'transparent'
  }

  attributeChangedCallback (attr, oldVal, newVal) {
    switch (attr) {
      case 'solid': {
        this.solid = newVal === ''
        this.renderStyle()
      }
    }
  }

  onScroll (event) {
    event.preventDefault()
    const contents = event.target
    const header = this.header
    const titlebar = this.titlebar
    const posY = contents.scrollTop

    const diffY = posY - Math.min(this.lastPosY, this.headerHeight)
    const h = Math.min(Math.max(titleHeight, header.offsetHeight - diffY), this.headerHeight)
    header.style.height = `${h}px`

    if (h <= titleHeight) {
      titlebar.style.backgroundColor = headerBackgroundColor
    } else {
      titlebar.style.backgroundColor = this.headerBackgroundColorDefault
      if (grad) {
        if (this.headerHeight <= h) {
          this.grad.style.opacity = 0
        } else if (posY > 25) {
          this.grad.style.opacity = (titleHeight / h) - 0.01 * (titleHeight / h)
        }
      }
    }

    if (posY <= this.headerHeight + stickyY) {
      // ヘッダの高さ変化アニメーションの実行中の区間
      header.style.top = '0px'
    } else {
      const diffY = posY - this.lastPosY
      if (diffY > 0) {
        // 正方向のスクロール
        header.style.top = `${Math.max(-titleHeight, header.offsetTop - diffY)}px`
      } else {
        header.style.top = `${Math.min(Math.max(-titleHeight, header.offsetTop - diffY), 0)}px`
      }
    }

    this.lastPosY = Math.max(0, posY)
  }

  onScrollEnd () {
    if (this.contents.scrollTop <= 0) return
    const event = new Event('scrollend')
    this.dispatchEvent(event)
  }

  SetPanelImage (srcUrl) {
    const bgImage = this.shadowRoot.querySelector('.background-image')
    requestAnimationFrame(() => {
      bgImage.style.backgroundImage = `url(${srcUrl})`
    })
  }

  renderStyle () {
    const oldStyle = this.shadowRoot.querySelector('style')
    if (oldStyle) oldStyle.remove()
    this.shadowRoot.appendChild(getStyle(this.headerHeight, this.headerBackgroundColorDefault).content.cloneNode(true))
  }

  render () {
    const shadowRoot = this.attachShadow({ mode: 'open' })
    this.renderStyle()
    shadowRoot.appendChild(getTemplate().content.cloneNode(true))
    shadowRoot.querySelector('#contents').addEventListener('scroll', this.onScroll.bind(this))

    this.contents = shadowRoot.querySelector('#contents')
    this.header = shadowRoot.querySelector('#header')
    this.titlebar = shadowRoot.querySelector('#title')
    this.grad = shadowRoot.querySelector('#grad')

    const scrollObserver = new IntersectionObserver(this.onScrollEnd.bind(this), { threshold: 0.5 })
    scrollObserver.observe(shadowRoot.querySelector('.tail'))

    const icon = shadowRoot.querySelector('#icon')
    icon.addEventListener('click', () => {
      this.dispatchEvent(new Event('icon-click'))
    }, false)
  }
}
