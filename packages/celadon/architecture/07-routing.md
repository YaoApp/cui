# 07 · 路由

- **版本**：v1.32
- **最后修改**：2026-10-03 09:06:46
- **说明**：地址语法 · 谁说了算 · `routes/` 的结构 · 文档标题

## 1. 规则

- **React Router 库模式**：`react-router@^8`，**不装 `@react-router/dev`**（不用框架模式）。
- **不用 hash 路由**：三端都提供真实路径空间；hash 会让宿主跳转 · 分享 · 埋点都多带一层。
  代价是**托管方要配 SPA fallback**（未知路径回 `index.html`，见 `04-host-integration.md`）。
- **一个面板一个具名参数**，别在参数值里再塞分隔符（`?sideThread=456` ✓ · `?side=thread:456` ✗）。
- **默认值不进 URL**（默认的 `activeTab=list` 之类删掉），链接才短。
- **分享链接只有一处生成**：`platform/utils/share-url.ts` 的 `buildShareUrl(...)`，带单测 ——
  手拼 URL 是这套东西烂掉的开始。
- **文档标题跟路由走**：`platform/router/use-page-title.ts` 的 `usePageTitle()`。列表页给固定名字，
  **详情页用对象名**（用户才知道开的是哪一个）。`document.title` 是宿主全局，所以这个 hook 住平台层。
- **路由路径不得占用 12 个保留前缀**（见 `04-host-integration.md`）。

## 2. 地址语法

```
/<surface>/<feature>/<object>?<面板参数>&<环境态>
   main|side
```

| 是什么 | 放哪 | 例 |
| --- | --- | --- |
| **主对象** | path | `/inbox/123` |
| **界面表面** | **path 第一段** | `/side/inbox/123` —— 同一个对象开在侧边 |
| **面板里打开的对象** · 选中项 · 环境态 | **query（具名）** | `?sideThread=456` · `?activeTab=files` |

- **表面是路径的一等公民**：`main`（主区）· `side`（侧边）；**侧边只是挂载点**，
  里面放哪个 feature 由路径的第二段决定。

## 3. store 与 URL

**store 是真相，URL 是它的书签。**

### 3.1 两条不变量

- **读（URL → store）只在 `navigationType === 'POP'`** —— 首次进入 + 浏览器前进 / 后退。
- **写（store → URL）只在值真的变了时** —— 没变不动历史。

实现只有一处：`platform/router/use-url-binding.ts`。其他地方**不许**在 effect 里写 URL
（机器强制 `check-effect-url-write.mjs`，唯一放行的就是那个文件）。

**为什么**：两个方向都活着、又互相触发，就是死循环（实测把 vitest 卡死，用例超时都拦不住）。
读只在 POP 就把这个环断开了 —— 我们自己写出去的导航是 PUSH / REPLACE，不会触发读。

### 3.2 绑定归属

**绑定归属由状态归属决定**（见 `06-state.md` §2）：**公共**状态由**路由层**绑一次，**私有**状态由它所属的
**feature 自己**绑。本节只管"怎么绑"。

### 3.3 导航语义

- **改筛选** → `replace`（打字不该塞满后退栈）。
- **打开面板** → `push`（后退应当关掉它）。

### 3.4 通用条目与参数名

公共条目是**通用**的（`{ kind, id }`，见 `06-state.md`），而地址栏要**具名**参数 —— 两者靠一张表对接：

例（新增种类时照这个样式加行）：

| 条目种类 | 参数名 |
| --- | --- |
| `world-entity` | `?sideEntity=` |

- **一个种类一个具名参数**，别把种类塞进参数值里（见 §1 的规则）。
- **这张表住路由层**（绑定处）：**新增种类只加一行，公共 store 不动**。

## 4. `routes/` 的构成

只有两类，**业务实现不住这里**（见 `00-principles.md` §2.1）：

| 放什么 | 文件 |
| --- | --- |
| **路由表**：URL → 元素 | `routes.tsx` |
| **表面与其布局**：`main` 主区 · `side` 侧边 | `surface-layout.tsx` · `surfaces.ts` |
| **导航项** 与"哪条 URL 是当前"的比较 | `platform/utils/nav.ts` —— 跨层共享的常量与纯函数 |

- **方向**：`routes/` 在依赖方向**最上层** —— 可以 import 组件层与能力层；**反过来不行**（单向）。
- 跨层共享的词汇与纯函数住 `platform/utils/`（`surfaces.ts` · `nav.ts` · `share-url.ts`）——
  否则 feature 为了拿它们只能反向 import `routes/`。
- 为什么不把表塞进入口 `main.tsx`：入口只负责"把应用装起来"；URL 契约与表面布局有独立的家，
  表会随 feature 变长，而表面布局不属于任何 feature。

## 5. 三端 basename

| 端 | basename | 来源 |
| --- | --- | --- |
| 宿主主应用 | `/<BASE>/` | 引擎注入的 `BASE` |
| `/iframe` 无壳 | `/<BASE>/` | 同上 |
| 桌面（Tauri） | 本地资产或代理 origin 的 `/` | 平台适配器 |

`basename` 一律由**平台适配器**注入，路由代码里不出现环境判断（见 `04-host-integration.md`）。

## 6. 文件结构

```
app/src/routes/            路由（只装配，不写业务）
├── routes.tsx             路由表：URL → 元素
├── surface-layout.tsx     表面布局：main 主区 · side 侧边
├── surface-layout.less    布局样式
└── surfaces.ts            useSurface：读当前表面

app/src/platform/router/   机制（三端 basename 从这里注入）
├── router.tsx             createBrowserRouter + RouterProvider
├── basename.ts            basename 适配器（取 Vite 的 base）
├── use-page-title.ts      文档标题跟路由走
└── use-url-binding.ts     值 ↔ 地址栏的绑定（两条不变量在这里）
```

## 7. 懒加载与深链恢复

- **懒加载按页面**：每条路由的 element 懒加载；feature 内部**不再二次分割**（除非有实测瓶颈）。
- **深链只恢复能由地址表达的**（当前对象 · 筛选 · 面板开合）。
  **滚动位置不做** —— 那是浏览器的默认行为，抢过来只会打架；**草稿不做** —— 要留就落 store 或服务端。
