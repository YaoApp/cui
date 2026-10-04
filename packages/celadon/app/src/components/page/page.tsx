import type { ReactNode } from 'react'
import './page.less'

/* **页面公共件**：正文容器 · 一段带标题 · 一行卡片 · 一行提示。
   页面自己的 `.less` 只留特有的（`plan/05-scaffold.md` §5）。 */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={className ? `page__body ${className}` : 'page__body'}>{children}</main>
}

export function PageSection({
  label,
  heading,
  children,
}: {
  label?: string
  heading?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="page__section" aria-label={label}>
      {heading === undefined ? null : <h2 className="page__heading">{heading}</h2>}
      {children}
    </section>
  )
}

export function PageRow({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="page__row" aria-label={label}>
      {children}
    </div>
  )
}

export function PageCell({ children }: { children: ReactNode }) {
  return <span className="page__cell">{children}</span>
}

export function PageNotice({ children }: { children: ReactNode }) {
  return (
    <p className="page__notice" role="status">
      {children}
    </p>
  )
}
