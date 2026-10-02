import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useNavigationType } from 'react-router'

/* 把一个 **store 值**绑定到 URL 参数 —— **URL 不是真相，store 是**（见 architecture/06-state.md · 07-routing.md）。

   为什么这样才安全：两个方向都活着、又互相触发，就是死循环（本项目踩过：vitest 直接卡死）。
   这里靠一条不变量断开：

   · **读（URL → 值）只在 `navigationType === 'POP'`** —— 首次进入 + 浏览器前进/后退；
     我们自己写出去的导航是 PUSH / REPLACE，读会早退，所以写不会触发读。
   · **写（值 → URL）没变就不动历史** —— 写完之后 URL 变成新的，effect 会再跑一次，
     这次发现"已经一致"，直接返回。

   导航语义按需分开：'replace'（筛选这类，不占历史）· 'push'（打开面板这类，值得后退）。 */
export type UrlBinding<T> = {
  /** 当前值（来自 store）*/
  value: T
  /** URL → 值。**只在 POP 时调用**，实现里直接写 store。 */
  read: (params: URLSearchParams) => void
  /** 值 → URL。就地改传入的 params。 */
  write: (params: URLSearchParams, value: T) => void
  mode?: 'replace' | 'push'
}

export function useUrlBinding<T>({ value, read, write, mode = 'replace' }: UrlBinding<T>) {
  const navigate = useNavigate()
  const { key, search } = useLocation()
  const navigationType = useNavigationType()

  // ① URL → 值：只在 POP（首次进入 / 前进后退）
  useEffect(() => {
    if (navigationType !== 'POP') return
    read(new URLSearchParams(search))
    // read 每次渲染都是新函数，故意不进依赖：只在导航发生时读
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, navigationType])

  // ② 值 → URL：单向写；一致就什么都不做（这是不会互相追的关键）
  // 依赖用一个**稳定字符串键**，真值走 ref —— 别用 JSON.parse(JSON.stringify(value))：
  // value 是 undefined 时 stringify 返回 undefined（不是字符串），parse 会抛。
  const valueRef = useRef(value)
  valueRef.current = value
  const valueKey = String(JSON.stringify(value))
  useEffect(() => {
    const params = new URLSearchParams(search)
    write(params, valueRef.current)
    const wanted = params.toString()
    if (wanted === search.replace(/^\?/, '')) return
    navigate(wanted ? `?${wanted}` : '?', { replace: mode === 'replace' })
    // write 故意不进依赖：同上
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueKey, search, mode, navigate])
}
