import { Outlet, useParams } from 'react-router'
import { isSurface } from '@/platform/utils/surfaces'
import { useSurface } from './surfaces'
import './surface-layout.less'

/* 装配：按表面决定页面放在哪里。侧边不是弹窗，是一个**挂载点** ——
   地址说"开在侧边"，这里就把同一棵树放进侧边容器。 */
export function SurfaceLayout() {
  const { surface } = useParams()
  const current = useSurface()

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
