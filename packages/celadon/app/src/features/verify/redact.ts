/* **秘密不上屏**：验证页会把每条结果印出来，所以"哪几条印不得"必须是一处可测的判定。
 *
 * 背景：复核者用变异证明过——把 redact 去掉时**没有任何用例变红**。这个函数就是为了让它能被钉住：
 * 判定归这里（纯函数、有用例），页面只调一处 `shouldRedact(label)`。 */

/** 印出来会泄露秘密的那些标签（只列读秘密的）。 */
const SECRET_LABELS = new Set(['credential.read'])

export function shouldRedact(label: string): boolean {
  return SECRET_LABELS.has(label)
}

/** 上屏用的替身 —— **任何情况下都不包含原值**。 */
export const REDACTED = '•••'
