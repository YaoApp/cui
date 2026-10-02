import { Outlet, useParams } from 'react-router'
import { useTranslation } from '@/platform/i18n'
import { useUrlBinding } from '@/platform/router/use-url-binding'
import { isSurface } from '@/platform/utils/surfaces'
import { type Entry } from '@/stores/entry'
import { useSidePanelStore } from '@/stores/side-panel'

/** 条目种类 → 地址栏参数名。一个种类一个具名参数；新增种类在这里加一行。 */
const SIDE_PANEL_PARAMS: Record<string, string> = { 'world-entity': 'sideEntity' }
import { useSurface } from './surfaces'
import './surface-layout.less'

/* 装配：按表面决定页面放在哪里。侧边不是弹窗，是一个**挂载点** ——
   地址说"开在侧边"，这里就把同一棵树放进侧边容器。 */
export function SurfaceLayout() {
  const { surface } = useParams()
  const current = useSurface()
  const { t } = useTranslation()
  const entry = useSidePanelStore((s) => s.entry)
  const open = useSidePanelStore((s) => s.open)

  /* **路由层替公共 store 绑定地址栏**（机制在 platform/router/use-url-binding.ts：
     读只在 POP、写只在值变化）。条目是通用的，参数名按**种类**选 —— 一个种类一个具名参数
     （见 `07-routing.md`：别把种类塞进参数值里）。新增种类时，在这张表加一行。 */
  useUrlBinding<Entry | undefined>({
    value: entry,
    mode: 'push',
    read: (params) => {
      for (const [kind, name] of Object.entries(SIDE_PANEL_PARAMS)) {
        const id = params.get(name)
        if (id) return open({ kind, id })
      }
      open(undefined)
    },
    write: (params, value) => {
      for (const name of Object.values(SIDE_PANEL_PARAMS)) params.delete(name)
      if (value) params.set(SIDE_PANEL_PARAMS[value.kind] ?? value.kind, value.id)
    },
  })

  if (!isSurface(surface)) {
    return <main className="surface surface--main">{t('surface.unknown', { surface: String(surface) })}</main>
  }

  if (current === 'side') {
    return (
      <div className="surface surface--split">
        <main className="surface__primary" aria-label={t('surface.main')} />
        <aside className="surface__side" aria-label={t('surface.side')}>
          <Outlet />
        </aside>
      </div>
    )
  }

  return (
    <main className="surface surface--main" aria-label={t('surface.main')}>
      <Outlet />
    </main>
  )
}
