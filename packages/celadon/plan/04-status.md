# 现状（2026-10-17）

- **规则**：[`architecture/`](../architecture/README.md) · **计划与结果册**：[`README.md`](README.md)
- **概述**：平台层、数据层与主界面已落地；产品功能里收件箱与认证是真实的一批，应用、看板、工作空间、电脑与设置仍是占位页。

## 1. 现有能力

| 层 | 内容 | 依据 |
| --- | --- | --- |
| `platform/client` | 一个 `client` 对象（清单 · 能力 · 宿主 · id）· `loadClient()` 统一装填 · 失败进入错误面 · React 面为偏好的 hook（语言 · 主题）· 窗口动作按能力暴露 | 单元用例 · 两端客户端实操 |
| `platform/service` | 基址唯一来源（桌面宿主提供）· `well-known` 惰性读取一次（并发去重 · 失败不缓存）· 更换地址即更换服务 | 单元用例 · 页面实操 |
| `platform/credential` | 载体按宿主选择（OS 凭据库 / Cookie）· 会话惰性镜像 · 登录动作收取令牌（仅在应用托管时采纳）· 退出清除 `session` 与 `refresh` 两项 | 单元用例 |
| `platform/transport` | 两宿主一套接口 · 失败以值形式返回 · 401 仅重放一次（**重放机制已具，刷新器尚无注入方**）· 跨域明确拒绝 | 单元用例 |
| `platform/bridge` | 18 条命令（`ping` 1 · `system` 11 · `service` 2 · `credential` 4）· 命名 `celadon_<域>_<动词>` · Web 宿主下不存在 | 跨语言比对用例 |
| `platform/{i18n,theme,router,icons,utils}` | 语言包按域就近（`features/*/locales/*.json` 与全局 `src/locales/*.json`）· 主题写入 `data-theme` · 页标题 · 失败码转界面文案 | 门禁 · 单元用例 |
| `data/request` 与 `data/hooks` | 出口 `send`（`{method, path, headers?, input?}`，不含会话开关）· 四态唯一实现 `useRequest` · 失效按 key 收敛 | 单元用例 |
| `data/{helloworld,test,user}` | 三个真域：测试端点 · 用户与登录 · 真实用户接口 | 单元用例 |
| `components/base` | 18 个基础件（按钮 · 输入 · 复选框 · 选择器 · 分段选择 · 弹层三件 · 图标 · 品牌标识 · 滚动 · 提示 · 加载 · 链接 · 一次性口令 · 验证码两件 · 动效），每个目录带中英 README | 单元用例 · 浏览器用例 |
| `components/{nav,content,browser,page,title-bar,window-controls}` | 三栏结构件与页面公共件，见 [`07-layout.md`](07-layout.md) | 单元用例 · 浏览器用例 |
| `routes` | 三栏装配（两组标签 · 分屏 · 让位 · 换边 · 独占）· 入口判定 · 产品面各页 · `/scaffold/*` · 未知路径返回入口 | 单元用例 · 浏览器用例 |
| `features/auth` | 登录 · 注册 · 欢迎 · 服务器选择 · 第三方回跳与回跳落点 · 会话失效与退出 | 单元用例 · 浏览器用例 |
| `features/inbox` | 收件箱：会话列表与阅读面，二级导航接进导航列 | 单元用例 · 浏览器用例 |
| `features/{modal,scaffold}` | 弹窗页面宿主 · 开发期脚手架四页 | 单元用例 |
| `stores/` | `layout/columns.ts`（两处收起 · 侧别 · 分屏方向与比例 · 本栏宽度）· `browser/{tab-group,tabs,secondary,targets}.ts`（两组标签与目标解析） | 单元用例 |
| 门禁 | `lint` · `check`（12 个检查器）· 检查器自测 **91/91**（另有 23 条文件模式用例）· 单元 **115 文件 / 784 条** · 浏览器 **130 条** · `build` | 每次交付前全部执行 |

## 2. 尚未具备的能力

| 缺口 | 影响 |
| --- | --- |
| **401 续期未接线**：刷新端点尚未声明，`setSessionRefresher` 有定义与导出、**无调用方** | 长会话 |
| 应用 · 看板 · 工作空间 · 电脑 · 设置五个入口仍是占位页 | 产品功能 |
| 外部地址页的真实抓取与渲染，维持占位 | 标签浏览器里的外链 |
| 导航列的窄视口浮层（手动展开覆盖中栏） | 窄窗口下的导航 |
| 内容区的双槽、单区与两栏三种形态 | 内容布局的其余形态 |
| SSE 与 WS 钩子 | 实时域 |
| `webproxy/`（agent sandbox 域名规则） | 沙箱域 |
| 打包、更新与 1.0 迁移 | 交付 |

## 3. 后续顺序

1. **五个占位入口逐个接真接口**（应用 → 看板 → 工作空间 → 电脑 → 设置），每个入口按域建立 `features/<域>/`，同时补齐各自的二级导航插槽。
2. **401 续期接线**：声明刷新端点，把刷新器注入 `platform/transport`，补一条真实的过期重放用例。
3. **实时域**：SSE 与 WS 钩子进 `data/hooks`，由看板或电脑先落地一处。
4. **导航列浮层**与内容区其余形态按设计稿随后实现，验收与现有三栏回归一起做。
