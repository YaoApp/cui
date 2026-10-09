/* **构建清单的唯一读者**（15-platform.md §5.3）。
 *
 * 规则：`client/` 只读它 · **别处不许再判宿主** · 构建把这一构建的事实注入进来。
 * 源文件写基础值（进 git），构建用 `CUI_CLIENT` 等环境给出的事实覆盖它（见 `vite.config.ts`）。 */

import raw from '@/platform/manifest.json'

export type ClientKind = 'web' | 'desktop'
export type ArtifactKind = 'unified' | 'cui' | 'web' | 'yao' | 'tai' | 'server'
export type TargetOs = 'macos' | 'windows' | 'linux' | ''

export type BuildInfo = {
  /** 提交（开发期为 `dev`） */
  commit: string
  /** 构建时刻 */
  at: string
  /** 谁构建的 */
  by: string
}

export type Manifest = {
  version: string
  build: BuildInfo
  client: ClientKind
  os: TargetOs
  artifact: ArtifactKind
  yao_version?: string
  tai_version?: string
  /** 应用支持的语言（**按语言包目录生成**，见 08-i18n.md；不是手写） */
  locales: readonly string[]
}

/* 构建注入的清单事实（见 `manifest-env.d.ts` 与 `vite.config.ts`）：空对象就用源文件里的基础值。 */
const manifest = { ...(raw as Manifest), ...__CELADON_MANIFEST__ }

/** 构建清单（只读）。**要判宿主就到这里来，不要各自读环境或猜 UA。** */
export function buildManifest(): Manifest {
  return manifest
}

/** 客户端类型由**打包**决定。 */
export function clientKind(): ClientKind {
  return manifest.client
}

/** 桌面目标系统由**打包**写入；web 包不写（运行时解析 UA，见 `ua.ts`）。 */
export function targetOs(): TargetOs {
  return manifest.os
}
