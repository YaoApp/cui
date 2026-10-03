/* **0.3 解包裹**：服务端有的返回 `{ data: ... }`，有的返回裸对象。
 *
 * 判据（宁可漏解，不可错解）：**只有对象的键全在信封词汇里**才剥一层 ——
 * 一个真的长着 `data` 字段的实体不会被误剥。
 */

/** 信封上可能出现的键（出现别的键就当它是实体本身）。 */
const ENVELOPE_KEYS = new Set(['data', 'meta', 'status', 'headers', 'error', 'error_description'])

export function unwrap<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const keys = Object.keys(raw as Record<string, unknown>)
    const enveloped = keys.length > 0 && keys.every((key) => ENVELOPE_KEYS.has(key))
    if (enveloped && 'data' in (raw as Record<string, unknown>)) {
      return (raw as Record<string, unknown>).data as T
    }
  }
  return raw as T
}
