import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useWorldStore } from './world.store'

/* URL ↔ store 的同步规则（见 architecture/07-routing.md）：

   · **URL → store**：挂载，以及**每一次导航**（含后退 / 前进）—— 深链从这里进来；
   · **store + URL → 一起写**：写在**动作**里（下面的 setFilter / openEntity），
     **不要**写「监视 store 再回写 URL」的观察者。

   为什么不能观察：两条方向不在同一批里落地。挂载时 URL 有 `?sideEntity=e2` 而写入端手里的
   store 值还是 undefined，它就把参数删掉；下一批 URL→store 又加回来 —— 你删我加，同步刷效果时
   就是死循环（实测踩过：vitest 直接卡住，连用例超时都拦不住）。

   导航语义分开：**过滤用 replace**（打字不该塞满后退栈）；**在侧边打开用 push**（后退应当关掉它）。 */
export function useWorldUrlSync() {
  const location = useLocation()
  const navigate = useNavigate()
  const query = useWorldStore((s) => s.query)
  const selectedEntityId = useWorldStore((s) => s.selectedEntityId)
  const setQuery = useWorldStore((s) => s.setQuery)
  const selectEntity = useWorldStore((s) => s.selectEntity)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setQuery(params.get('q') ?? '')
    selectEntity(params.get('sideEntity') ?? undefined)
    // 依赖 location.search：后退/前进也要把 URL 读回 store
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, location.search])

  const go = (mutate: (params: URLSearchParams) => void, replace: boolean) => {
    const params = new URLSearchParams(location.search)
    mutate(params)
    const search = params.toString()
    navigate({ search: search ? `?${search}` : '' }, { replace })
  }

  return {
    query,
    selectedEntityId,
    /** 过滤：store 与 URL 一起改，URL 用 replace */
    setFilter: (value: string) => {
      setQuery(value)
      go((params) => (value ? params.set('q', value) : params.delete('q')), true)
    },
    /** 在侧边打开某条：store 与 URL 一起改，URL 用 push（后退能关掉） */
    openEntity: (id?: string) => {
      selectEntity(id)
      go((params) => (id ? params.set('sideEntity', id) : params.delete('sideEntity')), false)
    },
  }
}
