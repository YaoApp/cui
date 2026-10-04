import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useRoutingStore } from './routing.store'

/* world 的**私有**绑定：只把过滤绑到 `?q=`。

   · **URL → store**：挂载 + 每一次导航（含后退 / 前进）—— 深链从这里进来；
   · **store + URL 一起写**：写在**动作**里（下面的 setFilter），**不写观察者**。

   为什么不能观察：两个方向不在同一批落地，挂载时 URL 有值而写入端手里还是 undefined，
   它就把参数删掉、下一批又加回来 —— 你删我加，同步刷效果时是死循环（实测卡死过）。

   被绑的值是**私有**的，所以绑定住在这里；**公共**的（侧边开着谁）由路由层绑，
   机制自己写在这一个钩子里（公共的 URL 绑定钩子已随侧边面撤掉）。
   导航语义：过滤用 replace（打字不该塞满后退栈）。 */
export function useRoutingUrlSync() {
  const location = useLocation()
  const navigate = useNavigate()
  const query = useRoutingStore((s) => s.query)
  const setQuery = useRoutingStore((s) => s.setQuery)

  useEffect(() => {
    setQuery(new URLSearchParams(location.search).get('q') ?? '')
    // 依赖 location.search：后退/前进也要把 URL 读回 store
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, location.search])

  return {
    query,
    /** 过滤：store 与 URL 一起改，URL 用 replace */
    setFilter: (value: string) => {
      setQuery(value)
      const params = new URLSearchParams(location.search)
      if (value) params.set('q', value)
      else params.delete('q')
      const search = params.toString()
      navigate({ search: search ? `?${search}` : '' }, { replace: true })
    },
  }
}
