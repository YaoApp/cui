import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useTranslation } from '@/platform/i18n'
import { useUrlBinding } from '@/platform/router/use-url-binding'
import { type Surface } from '@/platform/utils/surfaces'
import { type Entry } from '@/stores/entry'
import { useSidePanelStore } from '@/stores/side-panel'

/** 条目种类 → 参数名与**归属路径**。一个种类一个具名参数；新增种类在这里加一行。
   归属路径解决一件事：条目只由能渲染它的功能负责，落在别人的地盘上就是死参数。 */
const SIDE_PANEL_PARAMS: Record<string, { param: string; owner: string }> = {
  'world-entity': { param: 'sideEntity', owner: '/world' },
}
import './surface-layout.less'

/* 装配：按表面决定页面放在哪里。侧边不是弹窗，是一个**挂载点** ——
   地址说"开在侧边"（`/side/...`），这里就把同一棵树放进侧边容器。
   表面**由支路传入**，不从地址里取（见 architecture/07-routing.md）。 */
export function SurfaceLayout({ surface }: { surface: Surface }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const entry = useSidePanelStore((s) => s.entry)
  const open = useSidePanelStore((s) => s.open)

  /* **路由层替公共 store 绑定地址栏**（机制在 platform/router/use-url-binding.ts：
     读只在 POP、写只在值变化）。条目是通用的，参数名按**种类**选 —— 一个种类一个具名参数
     （见 `07-routing.md`：别把种类塞进参数值里）。新增种类时，在这张表加一行。 */
  useUrlBinding<Entry | undefined>({
    value: entry,
    mode: 'push',
    read: (params) => {
      for (const [kind, spec] of Object.entries(SIDE_PANEL_PARAMS)) {
        const id = params.get(spec.param)
        /* 深链落在别人的地盘上（如 `/hello?sideEntity=`）——**不认**，写回时参数会被抹掉。 */
        if (id) return open(pathname.startsWith(spec.owner) ? { kind, id } : undefined)
      }
      open(undefined)
    },
    write: (params, value) => {
      for (const spec of Object.values(SIDE_PANEL_PARAMS)) params.delete(spec.param)
      /* 未登记的种类**写不出去**（写了也读不回来，等于制造死参数）；
         不在自己地盘上也不写 —— 否则离开功能时会先把参数写回去、再删掉，
         多出两条历史（用户按后退回不去，2026-10-03 验收抓到）。 */
      const spec = value ? SIDE_PANEL_PARAMS[value.kind] : undefined
      if (value && spec && pathname.startsWith(spec.owner)) params.set(spec.param, value.id)
    },
  })

  /* 路由一离开它的地盘就作废条目 —— 否则切到别的功能后，地址栏还留着打不开的面板参数。
     放在这里（而不是功能的卸载清理）：布局始终挂着，也不会被 StrictMode 的双次挂载误伤。 */
  useEffect(() => {
    const spec = entry ? SIDE_PANEL_PARAMS[entry.kind] : undefined
    if (entry && spec && !pathname.startsWith(spec.owner)) open(undefined)
  }, [pathname, entry, open])

  if (surface === 'side') {
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
