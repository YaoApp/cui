import { useEffect, useState } from 'react'
import { ping, type HostStatus } from './ping'
import type { BridgeResult } from './result'

/** 问一次桥（验证函数 `ping`）。**只在挂载时问一次** —— 它不是数据，不会变。 */
export function useHostStatus(): BridgeResult<HostStatus> | undefined {
  const [status, setStatus] = useState<BridgeResult<HostStatus>>()
  useEffect(() => {
    let alive = true
    void ping().then((next) => {
      if (alive) setStatus(next)
    })
    return () => {
      alive = false
    }
  }, [])
  return status
}
