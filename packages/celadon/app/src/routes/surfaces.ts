import { useParams } from 'react-router'
import { isSurface, type Surface } from '@/platform/utils/surfaces'

export type { Surface }

/** 取当前表面；不是已知表面就退回 main（路由表的通配兜底负责报错）。 */
export function useSurface(): Surface {
  const { surface } = useParams()
  return isSurface(surface) ? surface : 'app'
}
