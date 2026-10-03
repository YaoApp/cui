/* **0.2 分页归一**：旧服务端有三套写法，一律归成 `Page<T>`。
 *
 * 认得的形状（其余一律抛给调用方看清 —— 不猜）：
 *   · `{ data: T[], page, pagesize, pagecount }`   （agent · chat）
 *   · `{ total, page, pageSize, totalPages, data }`（file）
 *   · 裸数组（没有分页信息）
 */

import type { Page } from '../types'

type Raw = Record<string, unknown>

function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function toPage<T>(raw: unknown, fallback: { page: number; pageSize: number }): Page<T> {
  if (Array.isArray(raw)) {
    return { items: raw as T[], page: fallback.page, pageSize: fallback.pageSize }
  }
  const source = (raw ?? {}) as Raw
  const items = (Array.isArray(source.data) ? source.data : Array.isArray(source.items) ? source.items : []) as T[]
  const page = num(source.page) ?? fallback.page
  const pageSize = num(source.pageSize) ?? num(source.pagesize) ?? fallback.pageSize
  const total = num(source.total) ?? num(source.count) ?? num(source.totalCount)
  const totalPages = num(source.pagecount) ?? num(source.totalPages)
  const hasMore =
    typeof source.next === 'string' ? true : total !== undefined ? page * pageSize < total : totalPages !== undefined ? page < totalPages : undefined
  return { items, page, pageSize, ...(total !== undefined ? { total } : {}), ...(hasMore !== undefined ? { hasMore } : {}) }
}
