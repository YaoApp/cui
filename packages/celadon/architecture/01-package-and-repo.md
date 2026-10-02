# 01 · 包与仓库

- **版本**：v1.4
- **最后修改**：2026-10-02 13:13:27
- **说明**：包 · 仓库形态 · 版本与发布 · 旧包处置

## 规则

- 包名 **`@yaoapp/cui`** · 版本 **`2.0.0`** · 发布进 **`next`** 标签（**不动 `latest`**）。
- **三个名字各司其职**：包名 `@yaoapp/cui` ｜ 设计体系 **Celadon** ｜ 目录 `packages/celadon/`。
- v2 在 `packages/celadon/` 内**自成一套**：自己的 `package.json` · `pnpm-workspace.yaml`（`packages: []`）· `pnpm-lock.yaml` · `node_modules`。
- 根工作区用 **`!packages/celadon` 排除**；**缺了本目录自己的 `pnpm-workspace.yaml`，在这里 install 会改到根锁文件**。
- 版本用 **caret**（`^`），不锁小版本。
- **pnpm 版本由本目录自己钉**：`package.json` 的 `packageManager` 写在本目录，不靠仓库根 ——
  否则根一改，这里的 CI 跟着变（隔离不彻底）。
- **CI 也是隔离的**：两份 workflow（`celadon-test-build.yml` · `celadon-browser-test.yml`，名字都带 `celadon` 前缀 ·
  只在 `packages/celadon/**` 有改动时跑）用 `working-directory: packages/celadon` ·
  `pnpm install --frozen-lockfile` · `setup-node` 的 `cache-dependency-path` 指向本目录的锁文件 ·
  `pnpm/action-setup` 用 `package_json_file` 指向本目录的 `package.json`。
- **发布面由 `files` 白名单决定**：`dist` · `app` · `design` · `scripts` · 配置 · 说明文件。
  **`app/logs` 必须用取反模式 `!app/logs` 排掉** —— `files` 白名单里的东西**不能**被 `.npmignore` / `.gitignore` 排除
  （实测：加 `app` 后打包带进 9 份测试日志；加 `.npmignore` 无效，`!app/logs` 有效）。
  `plan/` 与 `architecture/` 不在白名单里，**不进发布包**。
- **生命周期脚本里不放 `prepare`**：它会在 `pnpm install` 时执行，让"先测后构建"的 CI 顺序失效
  （实测确证）。构建只挂 **`prepack`**（只在打包发布时跑）。
- 旧包**不升级 · 不复活 · 不删**（仍被旧应用依赖）。

## 禁止

- 新代码**不得**引用旧包（`@yaoapp/cui`）—— 见 `13-quality-gates.md` 的反向依赖门禁。
- 不引 npm / yarn，包管理器只用 **pnpm**。

## 台账

从旧包复制任何文件都要登记 **源 → 目标 → 改了什么 → 为什么**，并过四道工序：
① 删掉没用到的分支 / props / 样式 ② 换成语义 token（禁硬编码）③ 文案走 i18n key ④ 命名全称化。
