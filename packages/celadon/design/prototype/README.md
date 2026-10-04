# prototype/ — 产品级静态设计图（纯 HTML + 设计 token）

**用途**：先把 UE 与 UI 定下来，再写产品代码。静态图虽以原型形态交付，**与产品 100% 一致**：
同一套结构、同一套类名（`.input` · `.btn-primary` · `.hint-error` · `.link` · `.focusable`）、同一套文案来源
（`../i18n/bundle.js` 的 `ui.entry.*`）。代码可 1:1 映射进产品，不写"只给设计看"的样式。

## 约定

1. 只引 [`../tokens.css`](../tokens.css) 与 [`../i18n/bundle.js`](../i18n/)；不引产品代码，也不复制产品样式。
2. 颜色、间距、字号、圆角、描边、阴影一律取 token；不出现字面量色值。（卡片宽度一类**布局尺寸**写成局部变量并注明，进产品时归 token。）
3. **页面上不放评审用控件**（主题、语言、状态一律走查询参数），否则就不像产品：
   `?state=…&theme=light|dark&lang=zh-CN|zh-TW|en-US|ja`
4. 一页一文件，一个一个设计；当前三个：`entry.html`（入口：登录与注册归一）· `servers.html`（服务器选择）· 第三个待定。
5. 每页覆盖**完整状态**（不是只画成功路径）：见各页头部的注释。
6. 交互照产品来：行内校验（离开字段即反馈）、回车提交、焦点管理、禁用与进行态、错误带下一步动作。

## 怎么看

```bash
node packages/celadon/design/serve.mjs        # 默认 8080
# 浏览器：/prototype/entry.html?state=register&theme=dark&lang=en-US
```

## 评审

走扩展技能 **`design-review`**：派只读复核者，先读 [`../AGENTS.md`](../AGENTS.md)，再看代码，最后看截图。
