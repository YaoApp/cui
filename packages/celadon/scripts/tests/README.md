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

检查器用**第一个参数**接收目标目录（默认 `../design`），所以样本不需要长得像真项目：

```bash
node scripts/check-css-conventions.mjs scripts/tests/cases/css-conventions/clean
```

## 现有样本

| 检查器 | 样本 |
| --- | --- |
| `check-css-conventions` | 10 条规则各一个反例 + `clean`（纯逻辑属性）+ `clean-exempt-marker`（有物理属性但带豁免标记）|
| `check-tokens` | `clean`（全走 token，含逻辑边框线宽）+ `violation`（写死字号/行高/圆角/内距）+ `violation-muted-text`（装饰色承载文字）+ `violation-border-logical`（`border-inline-start: 2px`）+ `violation-colour-in-fill`（`fill:#FF0000`）+ `violation-outline-colour`（`rgba()`）+ `violation-shorthand-asym`（`margin: 0 0 0 auto`） + `violation-brace-mismatch`（大括号不配对）+ `violation-missing-semicolon`（漏分号）+ `violation-font-shorthand`（`font:` 简写）|
| `check-i18n` | `clean`（三语齐全）+ `violation-missing-key` + `violation-untranslated`（ja 与 zh-CN 同文）+ `violation-simplified-in-tw`（繁中夹简体字）+ `violation-en-in-chinese`（en 里写着中文） + `violation-abbrev-key`（key 用缩写）+ `violation-key-naming`（含下划线）+ `violation-key-depth`（4 段）+ `violation-extra-key`（某语多出 key）|
| `check-readme-values` | `clean` + `violation`（README 色值与 tokens 不一致）|

## 没被样本覆盖的

- **`check-generated`**：它会**真的重新生成**一遍产物再比对 —— 需要整套图标雪碧图与清单，还要一个**可写的副本目录**（它会把生成结果写进去），属于集成级检查。不喂样本，靠**日常运行**（它就是产物一致性的那一道）。

其余四个检查器的**每条规则都有样本**（共 33 个用例）。加样本时如果发现某条规则没法用样本表达，写在这里，别默默跳过。

## 加一个样本

1. 在 `cases/<检查器>/` 下建目录，名字按上表前缀起；
2. 放上检查器要读的文件（`check-tokens` 要那 5 个固定页面名，`check-i18n` 要 `i18n/*.json`）；
3. 跑 `run.mjs`，确认它的结果与目录名一致。
