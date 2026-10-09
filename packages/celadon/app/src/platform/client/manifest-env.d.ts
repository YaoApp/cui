/* 构建注入的清单事实（见 `vite.config.ts` 的 `manifestOverrides` 与 `vitest.config.ts` 的对应项）。
   声明放在单独的文件里：同一文件里 `declare` 会让开发期的替换跳过这个名字（构建期不受影响）。
   两个入口都保证注入一个对象（不设 `CUI_CLIENT` 时注入 `{}`），因此这里不是可选的。 */

declare const __CELADON_MANIFEST__: Record<string, unknown>
