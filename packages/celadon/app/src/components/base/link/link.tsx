import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { Link as RouterLink } from 'react-router'
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
 * 应用命名空间（与 Vite 的 `base` 同一个来源，`platform/router/basename.ts` 也由它派生）。
 * 真链接带命名空间、路由路径不带，两者混用会出现 `/app/app/…`，因此交给路由组件前要剥掉这一层。
 */
function namespace(): string {
  const base = import.meta.env.BASE_URL || '/'
  return base.endsWith('/') ? base.slice(0, -1) : base
}

/**
 * 文字链接：站内与站外共用一个组件。
 *
 * 上游没有链接类组件，只有 `useRender` 与 `mergeProps` 这套渲染契约，因此这件按那套契约写：
 * 默认落 `<a>`，调用方可用 `render` 换成路由组件，`className` 与其余属性按上游规则合并（后面的覆盖前面的、
 * `className` 拼接、事件处理器按序都调用）。
 *
 * **站内地址默认走路由**。规范要求真链接写作 `<a href>` 并带命名空间（`appHref`），这种写法交给浏览器就是
 * **整页加载**：应用要重新下载、客户端事实（含 `GET /.well-known/yao`）要重读一次，用户看到一次首帧占位。
 * 因此站内路径（带命名空间、或以 `/` 开头）改由路由组件的 `Link` 渲染：它同样落 `<a href>`，
 * 中键新开、复制地址、右键菜单照旧，只有左键普通点击不再整页重载。外部地址（`external`）仍落普通 `<a>`，
 * 也正因为站内走路由，这个组件要用在路由之内。
 *
 * 外观只有一处：品牌墨色加下划线，悬停补一层品牌软底，键盘聚焦取焦点环。访问过的链接不做区分，
 * 界面里两个链接都在卡片内、指向外部文档，区分历史不是这里要表达的信息。
 */
export function Link({ href, external = false, render, className, children, ...rest }: LinkProps) {
  const state: LinkState = { external }
  const route = href?.startsWith(`${namespace()}/`) ? href.slice(namespace().length) : href
  const inApp = !external && typeof route === 'string' && route.startsWith('/')
  return useRender({
    render: render ?? (inApp ? <RouterLink to={route} /> : undefined),
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
