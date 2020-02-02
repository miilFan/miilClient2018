scrollHeaderPanel.addEventListener('click-icon', event => {
  const target = event.target
  target.scrollContainerTo(0)
  requestAnimationFrame(() => {
    if (target.solid) {
      target.removeAttribute('solid')
      target.setAttribute('gradation', '')
    } else {
      target.setAttribute('solid', '')
      target.removeAttribute('gradation')
    }
  })
})
