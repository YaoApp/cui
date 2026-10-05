/* **机器码 → 语言包 key**：码是 `snake_case` 分段，key 是 `lowerCamelCase`（`check-i18n` 的命名约定）。
 * `theme.expected_light_or_dark` → `theme.expectedLightOrDark`；前缀（`bridge.error.` / `data.error.`）
 * 由各自的调用处加。放在 `platform/i18n/` 是为了**两边共用一份**：桥与数据层都按码取文案。 */
export function codeToKey(code: string): string {
  return code
    .split('.')
    .map((segment) => segment.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase()))
    .join('.')
}
