# prototype/ — 产品级静态设计图（纯 HTML + 设计 token）

**用途**：先把 UE 与 UI 定下来，再写产品代码。设计图以原型形态交付，但**与产品 100% 一致**：
同一套类名（`.input` · `.btn-primary` · `.hint-error` · `.link` · `.focusable`）、同一套文案来源
（`../i18n/*.json` 的 `ui.entry.*`）、同一个 LOGO 文件（`../logo-mark-celadon.svg`）。

## 约定

1. **只做设计，不做功能**：页面**不含交互脚本**，不演示状态切换；状态用**分开的页面**表达。
2. 只引 [`../tokens.css`](../tokens.css)（可再引 [`../i18n/bundle.js`](../i18n/)）；不引产品代码，也不复制产品样式。
3. 颜色、间距、字号、圆角、描边、阴影一律取 token；不出现字面量色值。（卡片宽度一类**布局尺寸**写成局部变量并注明，进产品时归 token。）
4. 主题由平台偏好决定：浅色即页面原样，深色是同一页加 `data-theme="dark"`；页面里不写第二份，也不放主题开关。
5. 一页一个状态，一个一个设计。当前：`login.html`（登录）· `register.html`（注册，待做）· `servers.html`（服务器选择，待做）。
6. LOGO 一律用正版文件，不重绘、不改色。

## 怎么看

```bash
node packages/celadon/design/serve.mjs        # 默认 8080
# 浏览器：/prototype/login.html
```

## 评审

走扩展技能 **`design-review`**：派只读复核者，先读 [`../AGENTS.md`](../AGENTS.md)，再看代码，最后看截图。
