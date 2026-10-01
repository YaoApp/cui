import type { ReactNode } from 'react'

/* 私有子组件：只有 Button 用，所以住在它的 parts/ 里。
   parts/ 里放的是组件 —— 同样一个目录、一套结构。 */
export function Label({ children }: { children: ReactNode }) {
  return <span className="button__label">{children}</span>
}
