# 07 · 路由

- **状态**：✅ 已定（2026-10-02）

## 机制

- **React Router 库模式**：`react-router@^8`，**不装 `@react-router/dev`**（不用框架模式）。
- **不用 hash 路由** —— 三端都提供真实路径空间；hash 会让宿主跳转 · 分享 · 埋点都多带一层
  （外部旁证：Azure 的 hash 深链一直难用）。

## 地址语法

```
/<surface>/<feature>/<object>?<面板参数>&<环境态>
   main|side
```

| 是什么 | 放哪 | 例 |
| --- | --- | --- |
| **主对象** | path | `/inbox/123` |
| **界面表面** | **path 第一段** | `/side/inbox/123` —— 同一个对象开在侧边 |
| **面板里打开的对象** · 选中项 · 环境态 | **query（具名）** | `?sideThread=456` · `?activeTab=files` |

- **表面是路径的一等公民**：`main`（主区）· `side`（侧边）；**侧边只是挂载点**，里面放哪个 feature
  由路径的第二段决定。
- **一个面板一个具名参数**，别在参数值里再塞分隔符（`?side=thread:456` ✗ → `?sideThread=456` ✓）。
- **默认值不进 URL**（默认的 `activeTab=list` 之类删掉），链接才短。
- **分享链接只有一处生成**：`platform/utils/share-url.ts` 的 `buildShareUrl(...)`，带单测 ——
  手拼 URL 是这套东西烂掉的开始。放在 utils 而不是 routes，是因为 feature 也要用它（方向见下）。

## 谁说了算

**store 是真相，URL 是它的书签。** 两条方向各走各的路：

| 方向 | 什么时候 | 怎么做 |
| --- | --- | --- |
| **URL → store** | 挂载，以及**每一次导航**（后退 / 前进也算） | 读 URL 写 store |
| **store + URL 一起写** | 在**动作里**（改过滤、打开面板、关闭面板） | 同一个动作里既改 store 也导航 |

- **禁止「监视 store 再回写 URL」的观察者。**（机器强制：`check-effect-url-write.mjs` —— effect 里出现
  `setSearchParams` / `navigate` 即失败。） 两个方向不在同一批里落地：挂载时 URL 有 `?sideEntity=e2`
  而写入端手里的 store 值还是 `undefined`，它就把参数删掉；下一批 URL→store 又加回来 —— 你删我加，
  同步刷效果时是**死循环**（实测：vitest 直接卡死，连用例超时都拦不住）。
- **导航语义分开**：过滤用 `replace`（打字不该塞满后退栈）；打开面板用 `push`（后退应当关掉它）。
- 深链进入 = 用 URL 初始化 store，而不是让 URL 驱动每一次渲染。

## 三端

| 端 | basename | 来源 |
| --- | --- | --- |
| 宿主主应用 | `/<BASE>/` | 引擎注入的 `BASE` |
| `/iframe` 无壳 | `/<BASE>/` | 同上 |
| 桌面（Tauri） | 本地资产或代理 origin 的 `/` | 平台适配器 |

`basename` 一律由**平台适配器**注入，路由代码里不出现环境判断（见 `04-host-integration.md`）。

## 位置与方向

- **`app/src/routes/` 与 `features/` 并列**：可以 import `features/`；**`features/` 不许 import `routes/`**。
- **路由只做装配** —— 业务实现不住 `routes/`（见 `00-principles.md`）。
- 路由路径**不得**占用 12 个保留前缀（见 `04-host-integration.md`）。

## 待讨论

- 懒加载与代码分割的粒度（按页面 / 按 feature）。
- 深链的状态恢复范围（滚动位置 · 草稿）。
