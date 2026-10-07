import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import './link.less'

/** 渲染状态：外部链接会带上 `target` 与 `rel`。 */
export type LinkState = { external: boolean }

export type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href?: string
  /** 外部地址：新窗口打开，并带上 `noopener` 与 `noreferrer`。 */
  external?: boolean
  /** 换渲染元素，例如换成应用路由的 Link 组件；契约与上游 `useRender` 一致。 */
  render?: useRender.RenderProp<LinkState>
  className?: string
  children?: ReactNode
}

/**
 * 文字链接：站内与站外共用一个组件。
 *
 * 上游没有链接类组件，只有 `useRender` 与 `mergeProps` 这套渲染契约，因此这件按那套契约写：
 * 默认落 `<a>`，调用方可用 `render` 换成路由组件，`className` 与其余属性按上游规则合并（后面的覆盖前面的、
 * `className` 拼接、事件处理器按序都调用）。
 *
 * 外观只有一处：品牌墨色加下划线，悬停补一层品牌软底，键盘聚焦取焦点环。访问过的链接不做区分，
 * 界面里两个链接都在卡片内、指向外部文档，区分历史不是这里要表达的信息。
 */
export function Link({ href, external = false, render, className, children, ...rest }: LinkProps) {
  const state: LinkState = { external }
  return useRender({
    render,
    defaultTagName: 'a',
    state,
    props: mergeProps<'a'>(
      {
        href,
        target: external ? '_blank' : undefined,
        rel: external ? 'noopener noreferrer' : undefined,
        className: ['link', className].filter(Boolean).join(' '),
        children,
      },
      rest,
    ),
  })
}
