import { routerBasename } from '@/platform/router/basename'
import { SIDE_PREFIX, type Surface } from './surfaces'

export type ShareTarget = {
  surface?: Surface
  /** 路径第二段：哪个 feature。 */
  feature: string
  /** 路径第三段：哪个对象（可选，列表页没有）。 */
  object?: string
}

/* 分享链接**只在这里生成** —— 手拼 URL 是这套东西烂掉的开始（见 architecture/07-routing.md）。
   地址要发给别人，**必须带应用挂载的段**（base），否则对方打不开。
   默认值不进 URL：undefined 与空串都当作"没设"丢掉。 */
export function buildShareUrl(
  target: ShareTarget,
  params: Record<string, string | undefined> = {},
  origin = '',
): string {
  const prefix = target.surface === 'side' ? SIDE_PREFIX : ''
  const segments = [prefix, target.feature, target.object].filter(Boolean).join('/')
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, value)
  }
  const query = search.toString()
  return `${origin}${routerBasename()}/${segments}${query ? `?${query}` : ''}`
}
