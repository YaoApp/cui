import { useEffect, useState } from 'react'
import { ping, type ClientInfo } from './ping'

/** 问一次客户端自述。**只在挂载时问一次** —— 它不是数据，不会变（见 plan/02-platform.md §2.1）。 */
export function useClientInfo(): ClientInfo | undefined {
  const [info, setInfo] = useState<ClientInfo>()
  useEffect(() => {
    let alive = true
    void ping().then((next) => {
      if (alive) setInfo(next)
    })
    return () => {
      alive = false
    }
  }, [])
  return info
}
