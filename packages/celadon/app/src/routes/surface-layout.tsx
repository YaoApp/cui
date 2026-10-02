import { Outlet, useParams } from 'react-router'
import { useUrlBinding } from '@/platform/router/use-url-binding'
import { isSurface } from '@/platform/utils/surfaces'
import { useSidePanelStore } from '@/stores/side-panel'
import { useSurface } from './surfaces'
import './surface-layout.less'

/* 装配：按表面决定页面放在哪里。侧边不是弹窗，是一个**挂载点** ——
   地址说"开在侧边"，这里就把同一棵树放进侧边容器。 */
export function SurfaceLayout() {
  const { surface } = useParams()
  const current = useSurface()
  const entityId = useSidePanelStore((s) => s.entityId)
  const open = useSidePanelStore((s) => s.open)

  /* **路由层替公共 store 绑定地址栏** —— 路由只管怎么绑，机制在
     platform/router/use-url-binding.ts（读只在 POP、写只在值变化）。
     侧边开着谁 → `?sideEntity=`，push（后退应当关掉它）。 */
  useUrlBinding<string | undefined>({
    value: entityId,
    mode: 'push',
    read: (params) => open(params.get('sideEntity') ?? undefined),
    write: (params, value) => (value ? params.set('sideEntity', value) : params.delete('sideEntity')),
  })

  if (!isSurface(surface)) {
    return <main className="surface surface--main">未知的界面表面：{String(surface)}</main>
  }

  if (current === 'side') {
    return (
      <div className="surface surface--split">
        <main className="surface__primary" aria-label="主区" />
        <aside className="surface__side" aria-label="侧边">
          <Outlet />
        </aside>
      </div>
    )
  }

  return (
    <main className="surface surface--main" aria-label="主区">
      <Outlet />
    </main>
  )
}
