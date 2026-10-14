/* 临时测量探针：量第三栏收放的逐帧读数，送回本机 127.0.0.1:5333。
   由 index.html 挂载，只在带 ?__probe=1 的地址上运行，验完即撤。 */
(() => {
  if (!new URLSearchParams(location.search).has('__probe')) return

  const send = (payload) => {
    const json = JSON.stringify(payload)
    try {
      fetch('http://127.0.0.1:5333/probe?data=' + encodeURIComponent(json), { mode: 'no-cors' })
    } catch {
      /* 通道不可用时另有标题可读 */
    }
    document.title = 'PROBE ' + json
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  if (!localStorage.getItem('celadon.session')) {
    localStorage.setItem('celadon.session', JSON.stringify({ [location.origin]: Date.now() }))
    if (!sessionStorage.getItem('probe-reload')) {
      sessionStorage.setItem('probe-reload', '1')
      location.reload()
      return
    }
  }

  async function waitFor(fn, timeout = 25000) {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      const value = fn()
      if (value) return value
      await wait(300)
    }
    return null
  }

  async function sample(action) {
    const rows = []
    let last = performance.now()
    let running = true
    const tick = (t) => {
      const column = document.querySelector('.browser')
      const hint = document.querySelector('.browser__hint')
      rows.push([
        column ? Math.round(column.getBoundingClientRect().width) : -1,
        hint ? Math.round(hint.getBoundingClientRect().width) : -1,
        Math.round(t - last)
      ])
      last = t
      if (running && rows.length < 150) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    await wait(100)
    action()
    await wait(1200)
    running = false
    return rows
  }

  const pack = (rows) => ({
    frames: rows.length,
    gaps: rows.slice(1).map((row) => row[2]),
    columns: rows.slice(0, 24).map((row) => row[0]),
    contentWidths: [...new Set(rows.map((row) => row[1]))].length
  })

  async function boot() {
    send({ stage: 'alive', url: location.href })
    const root = await waitFor(() => document.querySelector('.browser'))
    if (!root) return send({ error: 'no column', url: location.href })
    if (!root.hasAttribute('data-collapsed')) {
      document.querySelector('.browser__close').click()
      await wait(900)
    }
    const opening = await sample(() => document.querySelector('.content__head-key--browser').click())
    await wait(500)
    const closing = await sample(() => document.querySelector('.browser__close').click())
    send({
      opening: pack(opening),
      closing: pack(closing),
      viewport: [innerWidth, innerHeight],
      engine: navigator.userAgent.slice(0, 120)
    })
  }

  window.addEventListener('load', () => setTimeout(boot, 3000))
})()
