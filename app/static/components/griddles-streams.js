let count = 0
class GriddlesStreams extends HTMLElement {
  constructor (...props) {
    super(...props)

    this.col = 1
    this.gutter = 10
    this.width = 200

    this.newResolvedItems = []
    this.queue = []

    this.initialize()
    this.renderSlot()
    this.render()
  }

  static get is () { return 'griddles-streams' }
  static get observedAttributes () { return ['col', 'gutter', 'width'] }

  attributeChangedCallback (attr, oldVal, newVal) {
    switch (attr) {
      case 'col': {
        this.col = +newVal
        this.initialize()
        this.render()
        break
      }
      case 'gutter':
      case 'width': {
        this[attr] = +newVal
        this.renderStyle()
        break
      }
    }
  }

  initialize () {
    if (!this.shadowRoot) this.attachShadow({mode: 'open'})
    this.heights = new Array(this.col).fill(0)
  }

  get style () {
    const t = document.createElement('template')
    t.innerHTML = `
      <style class='style'>
        .stream {
          /* background-color: #555; */
          width: ${this.width}px;
          margin: 0 ${this.gutter}px;
        }
        .stream:first-of-type {
          margin-left: ${this.gutter * 2}px;
        }
        .stream:last-of-type {
          margin-right: ${this.gutter * 2}px;
        }
        .whole {
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }
      </style>
    `
    return t
  }

  get template () {
    const div = document.createElement('div')
    for (let i = 0; i < this.col; i++) {
      const stream = document.createElement('div')
      stream.className = `stream c${i}`
      div.appendChild(stream)
    }

    const t = document.createElement('template')
    t.innerHTML = `
      <div class='whole'>
        ${div.innerHTML}
      </div>
    `
    return t
  }

  getColumn (n) {
    return this.shadowRoot.querySelector(`.stream.c${n}`)
  }

  renderStyle () {
    const oldStyle = this.shadowRoot.querySelector('.style')
    if (oldStyle) oldStyle.remove()
    this.shadowRoot.appendChild(this.style.content.cloneNode(true))

    const slot = this.shadowRoot.querySelector('.slot-card-style')
    slot.addEventListener('slotchange', (e) => {
      const t = slot.assignedNodes()[0]
      if (t) {
        const oldStyle = this.shadowRoot.querySelector('.slot-style')
        if (oldStyle) oldStyle.remove()
        const style = t.content.cloneNode(true).firstElementChild
        style.className = 'slot-style'
        this.shadowRoot.appendChild(style)
      }
    }, false)
  }

  renderSlot () {
    const t = document.createElement('template')
    t.innerHTML = `
      <slot name='card-style' class='slot-card-style'></slot>
      <slot name='card' class='slot-card'></slot>
    `
    this.shadowRoot.appendChild(t.content.cloneNode(true))
  }

  render () {
    this.renderStyle()
    const whole = this.shadowRoot.querySelector('.whole')
    if (whole) whole.remove()
    this.shadowRoot.appendChild(this.template.content.cloneNode(true))
  }

  fetchImage (srcUrl, target) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        target.src = srcUrl
        resolve({
          src: srcUrl,
          width: target.offsetWidth,
          height: target.offsetHeight
        })
      }
      img.onerror = () => {
        reject()
      }
      img.src = srcUrl
    })
  }

  async solve () {
    if (this.queue.length === 0) {
      const event = new CustomEvent('renderend', {
        detail: { resolved: this.newResolvedItems.concat() }
      })
      this.dispatchEvent(event)
      return
    }
    const item = this.queue.shift()
    console.log('>', item)
    const names = Object.keys(item)
    const stream = this.getColumn(this.getMinimumHeightStreamIndex())

    const slot = this.shadowRoot.querySelector('.slot-card')
    const t = slot.assignedNodes()[0]
    const card = t.content.cloneNode(true).firstElementChild
    stream.appendChild(card)
    item.ref = card.querySelector('a')

    for (const name of names) {
      const target = card.querySelector(`.${name}`)
      if (!target) continue
      const {type, value} = item[name]
      switch (type) {
        case 'text': {
          target.innerText = value
          break
        }
        case 'link': {
          target.href = value
          break
        }
        case 'image': {
          const res = await this.fetchImage(value, target)
          item[name]._ = res
          break
        }
      }
    }

    // set focus
    const fItem = this.newResolvedItems[0]
    if (fItem && document.activeElement !== this) {
      requestAnimationFrame(() => { fItem.ref.focus() })
    }

    this.newResolvedItems.push(item)
    this.solve()
  }

  getMinimumHeightStreamIndex () {
    let min = -1
    let res = -1
    for (let i = 0; i < this.col; i++) {
      const streamHeight = this.getColumn(i).offsetHeight
      this.heights[i] = streamHeight
      if (min < 0 || streamHeight < min) {
        min = streamHeight
        res = i
      }
    }
    return res
  }

  async Enqueue (...items) {
    console.log('> enqueue', count)
    count++
    this.newResolvedItems.length = 0
    this.queue.push(...items)
    await this.solve()
  }

  IsQueueEmpty () {
    return this.queue.length === 0
  }

  ClearStreams () {
    for (let i = 0; i < this.col; i++) {
      this.getColumn(i).innerHTML = ''
    }
  }
}

customElements.define(GriddlesStreams.is, GriddlesStreams)
