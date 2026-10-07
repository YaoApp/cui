import { useEffect } from 'react'
import { useTranslation } from '@/platform/i18n'

/**
 * 文档标题（浏览器标签页与历史记录里的名字）。
 *
 * 页面只给**这一页叫什么**（例如「登录」），应用名由这里统一带上，改名只改一处。
 * 依赖里带 `t`：语言一换，标题跟着换，不必刷新页面。
 */
export function useDocumentTitle(page?: string): void {
  const { t } = useTranslation()
  useEffect(() => {
    const app = t('app.name')
    document.title = page ? `${page} · ${app}` : app
  }, [page, t])
}
