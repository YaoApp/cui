/* sample: effect 里改 URL —— 必须判违规（会与 URL→store 互相追成同步死循环） */
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'

export function useSync() {
  const location = useLocation()
  const navigate = useNavigate()
  const q = new URLSearchParams(location.search).get('q')

  useEffect(() => {
    navigate({ search: q ? `?q=${q}` : '' }, { replace: true })
  }, [q])
}
