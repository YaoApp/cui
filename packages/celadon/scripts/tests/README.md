# 检查器的测试

把每个检查器喂给一组样本，核对「**该过的过、该挂的挂**」—— 免得检查器哪天悄悄失效，或者被
"扫到 0 个文件也算通过"这种空过骗过去（`check-css-conventions` 就因此加了一条 0 文件护栏）。

## 跑

```bash
node packages/celadon/scripts/tests/run.mjs
```

输出一行一个用例 + 末尾 `N / N 用例通过`；有失败时打印前几行输出并以非 0 退出。

## 目录约定

```
tests/
  run.mjs                 跑全部用例
  cases/<检查器>/<用例>/    每个用例一个目录
```

**用例目录名即期望结果**：

| 目录名前缀 | 期望 | 用途 |
| --- | --- | --- |
| `clean` | 检查器**通过**（退出码 0）| 正常输入；也用来放"应该豁免"的样本 |
| `violation` | 检查器**失败**（退出码非 0）| 反例，每条规则一个 |

> 另有一类**护栏**样本：目录里没有可检查的东西时，检查器必须**失败** —— "扫到 0 个文件也算通过"是最危险的假绿。

检查器用**第一个参数**接收目标目录（默认 `../design`），所以样本不需要长得像真项目：

```bash
node scripts/check-css-conventions.mjs scripts/tests/cases/css-conventions/clean
```

## 现有样本

| 检查器 | 样本 |
| --- | --- |
| `check-css-conventions` | 10 条规则各一个反例 + `clean`（纯逻辑属性）+ `clean-exempt-marker`（有物理属性但带豁免标记）|
| `check-tokens` | `violation-no-pages`（**没有页面** → 护栏报错，防"扫到 0 页也通过"）+ `clean`（全走 token，含逻辑边框线宽）+ `violation`（写死字号/行高/圆角/内距）+ `violation-muted-text`（装饰色承载文字）+ `violation-border-logical`（`border-inline-start: 2px`）+ `violation-colour-in-fill`（`fill:#FF0000`）+ `violation-outline-colour`（`rgba()`）+ `violation-shorthand-asym`（`margin: 0 0 0 auto`） + `violation-brace-mismatch`（大括号不配对）+ `violation-missing-semicolon`（漏分号）+ `violation-font-shorthand`（`font:` 简写）|
| `check-i18n` | `clean`（三语齐全，且 key **拆在共用 / feature / 组件三处**，验证合并）+ `violation-missing-baseline`（没有基准语言 `zh-CN`）+ `violation-missing-key` + `violation-untranslated`（ja 与 zh-CN 同文）+ `violation-simplified-in-tw`（繁中夹简体字）+ `violation-en-in-chinese`（en 里写着中文） + `violation-abbrev-key`（key 用缩写）+ `violation-key-naming`（含下划线）+ `violation-key-depth`（4 段）+ `violation-extra-key`（某语多出 key）+ `clean-no-hardcoded-han`（代码无汉字，注释里的中文被剥掉）+ `violation-hardcoded-han`（代码里写死汉字文案）|
| `check-i18n-types` | `clean`（产物与三处语言包生成的类型一致）+ `violation-stale`（产物里的 key 与语言包对不上 → 过期）|
| `check-readme-values` | `clean` + `violation`（README 色值与 tokens 不一致）|
| `check-plan-md` | `clean` + `violation-width`（表格列数不一致）+ `violation-orphan-row`（孤立表格行）|
| `check-app-layout` | `clean`（单测挨着源文件 · 浏览器与拟人住 `tests/`）+ `violation-unit-in-tests-dir`（单测住进了 `tests/`）+ `violation-unit-without-sibling`（单测旁边没有源文件）+ `violation-browser-beside-source` · `violation-spec-beside-source` · `violation-agent-script-beside-source`（后三条：该进 `tests/` 的散在源码目录）|
| `check-base-components` | `clean`（`features/` 里用 `<Button>`）+ `clean-components`（`components/` 里用基础件）+ `clean-exempt-base`（`components/base/` 里落原生 `<button>` 被豁免）+ `violation-raw-button` · `violation-raw-button-in-component` · `violation-raw-select-in-component`（`features/` 与 `components/` 里裸写控件）|
| `check-generated` | `clean`（两份 `tokens.css` 都与 `tokens.less` 一致）+ `violation-design-stale` · `violation-theme-stale`（各让一份产物过期，两份都比）|

## 没被样本覆盖的

- **`check-generated` 的图标比对**（`icons.html` / `mock.html`）：它要**整套图标雪碧图与清单**，只跑真实仓库（给了目标目录时只比对两份 `tokens.css`）。
- 它比对 `tokens.css` 时会**原地重写产物**，所以样本先整目录拷进临时目录再跑（见 `run.mjs` 的 `DESTRUCTIVE`）—— 否则反例会被"修好"，下次假绿。

**共 63 个用例**。加样本时如果发现某条规则没法用样本表达，写在这里，别默默跳过。

## 加一个样本

1. 在 `cases/<检查器>/` 下建目录，名字按上表前缀起；
2. 放上检查器要读的文件（`check-tokens` 要那 5 个固定页面名，`check-i18n` 要 `app/src/**/locales/*.json`）；
3. 跑 `run.mjs`，确认它的结果与目录名一致。
