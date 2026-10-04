# 07 · 路由

- **版本**：v1.41
- **最后修改**：2026-10-03 17:19:12
- **说明**：地址语法 · 谁说了算 · `routes/` 的结构 · 文档标题

## 1. 规则

- **React Router 库模式**：`react-router@^8`，**不装 `@react-router/dev`**（不用框架模式）。
- **不用 hash 路由**：两端都提供真实路径空间；hash 会让宿主跳转 · 分享 · 埋点都多带一层。
  代价是**托管方要配 SPA fallback**（未知路径回 `index.html`，见 `04-host-integration.md`）。
- **一个面板一个具名参数**，别在参数值里再塞分隔符（`?q=alpha` ✓ · `?filter=name:alpha` ✗）。
- **默认值不进 URL**（默认的 `activeTab=list` 之类删掉），链接才短。
- **分享链接只有一处生成**：`platform/utils/share-url.ts` 的 `buildShareUrl(...)`，带单测 ——
  手拼 URL 是这套东西烂掉的开始。
- **文档标题跟路由走**：`platform/router/use-page-title.ts` 的 `usePageTitle()`。列表页给固定名字，
  **详情页用对象名**（用户才知道开的是哪一个）。`document.title` 是宿主全局，所以这个 hook 住平台层。
- **应用整个跑在构建决定的命名空间之下**（默认 `app`，见 §2 · `04-host-integration.md`）——
  与引擎的路径**不同层**，因此**不需要避让清单**。

## 2. 地址语法

```
/<namespace>/<feature>/<object>?<面板参数>&<环境态>
     ↑
     构建决定的命名空间（默认 app）= base；根 / 不属于应用
```

| 是什么 | 放哪 | 例 |
| --- | --- | --- |
| **主对象** | 命名空间之下的 path | `/<namespace>/inbox/123` |
| **面板里打开的对象** · 选中项 · 环境态 | **query（具名）** | `?q=alpha` · `?activeTab=files` |

- **表面是脚手架，不是产品形态**：主区与侧边只是**跑通地址语法用的两个挂载点**；
  产品设计定了之后按设计改。本节约束的是**地址怎么写**（对象在路径、面板在具名 query），
  不承诺界面上真有"侧边"这么一个东西。
- **对象在路径里**：`/<namespace>/<域>/<对象>`（如 `/<namespace>/scaffold/routing/w1`）。
  里面放哪个 feature 由它后面那段决定。

## 3. store 与 URL

**store 是真相，URL 是它的书签。**

### 3.1 两条不变量

- **读（URL → store）只在 `navigationType === 'POP'`** —— 首次进入 + 浏览器前进 / 后退。
- **写（store → URL）只在值真的变了时** —— 没变不动历史。

实现只有一处：**页面自己的同步钩子**（如 `features/scaffold/routing/use-routing-url-sync.ts`）。其他地方**不许**在 effect 里写 URL
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
| `world-entity` | `?q=` |

- **一个种类一个具名参数**，别把种类塞进参数值里（见 §1 的规则）。
- **这张表住路由层**（绑定处）：**新增种类只加一行，公共 store 不动**。

## 4. `routes/` 的构成

只有两类，**业务实现不住这里**（见 `00-principles.md` §2.1）：

| 放什么 | 文件 |
| --- | --- |
| **路由表**：URL → 元素 | `routes.tsx` |
| **外壳**：所有页面住在主区里（侧边能力 2026-10-04 撤掉，没有产品页面时它没有消费者）| `surface-layout.tsx` |
| **导航项** 与"哪条 URL 是当前"的比较 | `features/scaffold/nav.ts` —— 跨层共享的常量与纯函数 |

- **方向**：`routes/` 在依赖方向**最上层** —— 可以 import 组件层与能力层；**反过来不行**（单向）。
跨层共享的词汇与纯函数住 `platform/utils/`（`share-url.ts`）；脚手架的导航住 `features/scaffold/nav.ts`
  否则 feature 为了拿它们只能反向 import `routes/`。
- 为什么不把表塞进入口 `main.tsx`：入口只负责"把应用装起来"；URL 契约与表面布局有独立的家，
  表会随 feature 变长，而表面布局不属于任何 feature。

## 5. 两端 basename

| 端 | basename | 来源 |
| --- | --- | --- |
| Web（引擎托管）| `/<namespace>/` | 构建决定（`CUI_BASE`，默认 `app`）|
| 桌面（Tauri） | `/<namespace>/` | 同一个命名空间 —— **两端一致**，根都不属于应用 |

`basename` 一律由**平台适配器**注入，路由代码里不出现环境判断（见 `04-host-integration.md`）。

## 6. 文件结构

```
app/src/routes/            路由（只装配，不写业务）
├── routes.tsx             路由表：URL → 元素（主区一支 · 侧边一支）
├── surface-layout.tsx     外壳：所有页面住在主区里
└── surface-layout.less    布局样式

app/src/platform/router/   机制（两端 basename 从这里注入）
├── basename.ts            basename 适配器（取 Vite 的 base）
├── use-page-title.ts      文档标题跟路由走
```

## 7. 懒加载与深链恢复

- **懒加载按页面**：每条路由的 element 懒加载；feature 内部**不再二次分割**（除非有实测瓶颈）。
- **深链只恢复能由地址表达的**（当前对象 · 筛选 · 面板开合）。
  **滚动位置不做** —— 那是浏览器的默认行为，抢过来只会打架；**草稿不做** —— 要留就落 store 或服务端。
