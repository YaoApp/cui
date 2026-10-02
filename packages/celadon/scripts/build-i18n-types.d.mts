/* build-i18n-types.mjs 的类型声明 —— 供 `app/src/platform/i18n/i18n-types.test.ts`（tsc 下的单测）import。
   脚本本身仍是零依赖的纯 Node ESM；这里只描述它导出的纯函数。 */

export declare const BASE: string

export declare function flat(
  object: Record<string, unknown>,
  prefix?: string,
  out?: Record<string, unknown>,
): Record<string, unknown>

export declare function collectPacks(root: string): Record<string, Record<string, unknown>>

export declare function baseKeys(root: string): string[]

export declare function typesPath(root: string): string

export declare function renderTypes(keys: string[]): string

export declare function buildTypes(root: string): { keys: string[]; content: string }
