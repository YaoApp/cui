/* sample: effect 只读 URL 写 store；写 URL 放在动作里 —— 正确 */
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'

export function useSync() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    void params.get('q')
  }, [location.search])

  const open = () => navigate({ search: '?q=1' })
  return { open }
}
