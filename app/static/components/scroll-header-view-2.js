class ScrollHeaderView extends HTMLElement {
  constructor () {
    super()
    this.render()
    this.lastPosY = 0
    // Custom attributes
    this.solid = false
    this.gradation = false
  }

  getTemplate () {
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
          <div id='titlebar'>
            <slot name='title'></slot>
          </div>
        </div>
        <div id='container'>
          <slot name='contents'></slot>
          <div class='tail'></div>
        </div>
      </div>
    `
    return t
  }

  clearStyle () {
    if (this.header) this.header.style = ''
    if (this.titlebar) this.titlebar.style = ''
    if (this.grad) this.grad.style = ''
  }

  getStyle () {
    const t = document.createElement('template')
    let headerHeight = 'var(--header-height-px)'
    let imagePaddingBottom = 0
    if (this.solid) {
      headerHeight = '(var(--header-height-px) + var(--title-height-px))'
      imagePaddingBottom = 'var(--title-height-px)'
    }
    t.innerHTML = `
      <style>
        #header {
          position: absolute;
          background: #eee;
          top: 0;
          width: 100%;
          height: calc(${headerHeight} * 1px);
          z-index: 700;
        }
        #grad, #image {
          position: absolute;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: var(--header-background-color, blue);
          opacity: 0;
        }
        #image {
          opacity: 1;
          padding-bottom: calc(${imagePaddingBottom} * 1px);
          box-sizing: border-box;
        }
        #image > .background-image {
          height: 100%;
          background-image: var(--header-background-image, none);
          background-size: cover;
          background-position: center center;
        }
        #menus {
          position: absolute;
          margin-top: 12px;
          width: 100%;
          top: 0;
          height: calc(var(--menus-height-px) * 1px);
          z-index: 900;
          user-select: none;
        }
        #icon {
          position: absolute;
          cursor: pointer;
          left: 18px;
        }
        #titlebar {
          background-color: var(--header-backgroind-color-default, transparent);
          position: absolute;
          bottom: 0;
          width: 100%;
          height: calc(var(--title-height-px) * 1px);
          z-index: 800;
        }
        #container {
          position: absolute;
          width: 100%;
          height: calc(100% - (${headerHeight} * 1px));
          padding-top: calc(${headerHeight} * 1px);
          top: 0;
          overflow: auto;
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
    this.clearStyle()
    return t
  }

  getCssVar (name, defaultValue) {
    return getComputedStyle(this.shadowRoot.firstElementChild).getPropertyValue(name).trim() || defaultValue
  }

  static get observedAttributes () {
    return ['solid', 'gradation']
  }

  get titleHeight () {
    return parseFloat(this.getCssVar('--title-height-px'))
  }

  get HeaderHeight () {
    const initHeight = parseFloat(this.getCssVar('--header-height-px'))
    return this.solid ? initHeight + this.titleHeight : initHeight
  }

  get headerBackgroundImageHeight () {
    return parseFloat(this.getCssVar('--header-background-image-height-px', this.HeaderHeight))
  }

  get headerBackgroundColor () {
    return this.getCssVar('--header-background-color')
  }

  get headerBackgroundColorDefault () {
    return !this.solid ? 'transparent' : this.getCssVar('--header-background-color-default')
  }

  get stickyY () {
    return parseFloat(this.getCssVar('--sticky-y-px', 0))
  }

  attributeChangedCallback (attr, oldVal, newVal) {
    if (oldVal === newVal) return
    switch (attr) {
      case 'solid':
      case 'gradation':
        this[attr] = newVal === ''
        this.renderStyle()
        break
    }
  }

  onScroll () {
    const header = this.header
    const titlebar = this.titlebar
    const posY = this.container.scrollTop

    const diffY = posY - Math.min(this.lastPosY, this.HeaderHeight)
    const h = Math.min(Math.max(this.titleHeight, header.offsetHeight - diffY), this.HeaderHeight)
    header.style.height = `${h}px`

    if (h <= this.titleHeight) {
      titlebar.style.backgroundColor = this.headerBackgroundColor
    } else {
      titlebar.style.backgroundColor = this.headerBackgroundColorDefault
      if (this.gradation) {
        if (this.HeaderHeight <= h) {
          this.grad.style.opacity = 0
        } else if (posY > 25) {
          this.grad.style.opacity = (this.titleHeight / h) - 0.01 * (this.titleHeight / h)
        }
      }
    }

    if (posY <= this.HeaderHeight + this.stickyY) {
      // ヘッダの高さ変化アニメーションの実行中の区間
      header.style.top = '0px'
    } else {
      const diffY = posY - this.lastPosY
      header.style.top = `${Math.min(Math.max(-this.titleHeight, header.offsetTop - diffY), 0)}px`
    }
    this.lastPosY = Math.max(0, posY)
  }

  onScrollEnd () {
    if (this.container.scrollTop <= 0) return
    const event = new Event('scrollend')
    this.dispatchEvent(event)
  }

  renderStyle () {
    const oldStyle = this.shadowRoot.querySelector('style')
    if (oldStyle) oldStyle.remove()
    this.shadowRoot.appendChild(this.getStyle().content.cloneNode(true))
  }

  render () {
    const shadowRoot = this.attachShadow({ mode: 'open' })
    this.renderStyle()
    shadowRoot.appendChild(this.getTemplate().content.cloneNode(true))
    shadowRoot.querySelector('#container').addEventListener('scroll', this.onScroll.bind(this))

    this.container = shadowRoot.querySelector('#container')
    this.header = shadowRoot.querySelector('#header')
    this.titlebar = shadowRoot.querySelector('#titlebar')
    this.grad = shadowRoot.querySelector('#grad')

    const scrollObserver = new IntersectionObserver(this.onScrollEnd.bind(this), { threshold: 0.5 })
    scrollObserver.observe(shadowRoot.querySelector('.tail'))

    const icon = shadowRoot.querySelector('#icon')
    icon.addEventListener('click', () => {
      this.dispatchEvent(new Event('click-icon'))
    }, false)
  }

  scrollContainerTo (y) {
    this.container.scrollTo({
      top: y,
      behavior: 'smooth'
    })
  }

  setHeaderBackgroungImage (srcUrl) {
    requestAnimationFrame(() => {
      this.shadowRoot.getElementById('scroll-header-view').style.setProperty('--header-background-image', `url("${srcUrl}")`)
    })
  }
}
