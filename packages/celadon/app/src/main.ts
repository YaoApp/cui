/* 工具链自检页：不引入框架，只用设计资产里的 token 渲染，
   用来证明 pnpm + Vite + celadon 目录这条链是通的。 */
import '../../design/tokens.css'

const t = (k: string) => `var(${k})`

document.getElementById('app')!.innerHTML = `
  <h1 style="font-size:var(--font-size-title);color:var(--text-primary);margin:0 0 var(--spacing-16)">
    celadon 1.0 · 工具链自检
  </h1>
  <p style="color:var(--text-secondary);margin:0 0 var(--spacing-24)">
    没有引入任何框架 —— 这一页只证明 <b>pnpm + Vite + 设计 token</b> 这条链是通的。
  </p>
  <section style="display:flex;gap:var(--spacing-12);flex-wrap:wrap">
    ${['--brand', '--success', '--warning', '--danger', '--text-primary', '--text-secondary']
      .map((name) => `<div style="background:${t(name)};color:var(--background-surface);
        padding:var(--spacing-12) var(--spacing-16);border-radius:var(--radius-medium);
        font-size:var(--font-size-caption);font-family:var(--font-family-monospace)">${name}</div>`)
      .join('')}
  </section>
`
