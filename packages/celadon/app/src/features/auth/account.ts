/** 账号形态：邮箱（含 `@` 与点号）或纯数字的手机号。判定宽松，真实校验在服务端。 */
export function looksLikeAccount(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
  return /^\d{6,}$/.test(trimmed)
}
