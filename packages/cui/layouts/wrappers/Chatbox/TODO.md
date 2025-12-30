# Sidebar Tabs 改造 TODO

## Phase 1: 基础结构 ✅

### 1.1 类型定义 ✅
- [x] 创建 `Container/types.ts`
  - [x] 定义 `SidebarTab` 接口
  - [x] 定义 `SidebarHistoryItem` 接口
  - [x] 定义 `SidebarTabsState` 接口
  - [x] 导出 Header 组件 Props 类型

### 1.2 状态管理 ✅
- [x] 修改 `index.tsx`
  - [x] 添加 `sidebarTabs` 状态 (`useState<SidebarTab[]>`)
  - [x] 添加 `activeSidebarTabId` 状态
  - [x] 实现 `addSidebarTab` 方法
  - [x] 实现 `removeSidebarTab` 方法
  - [x] 实现 `activateSidebarTab` 方法
  - [x] 修改 `handleOpenSidebar` 逻辑，创建 Tab 而非覆盖

---

## Phase 2: Header 改造 ✅

### 2.1 重构 Header 组件 ✅
- [x] 修改 `Container/Header.tsx`
  - [x] 删除导航菜单相关代码（Logo、快捷启动、菜单项）
  - [x] 添加 History 按钮 `[≡]`
  - [x] 添加 Tabs 渲染逻辑
  - [x] 保留右侧功能按钮（活动监视器、关闭）
  - [x] 添加 Tab 点击切换逻辑
  - [x] 添加 Tab 关闭按钮和逻辑
  - [x] 添加 Tabs 横向滚动支持

### 2.2 重写 Header 样式 ✅
- [x] 修改 `Container/header.less`
  - [x] 删除导航菜单相关样式
  - [x] 参考 `chatbox/components/Header/index.less` 独立实现 Tabs 样式
  - [x] 调整 Header 高度与 Chatbox Header 一致 (44px)
  - [x] 添加 History 按钮样式
  - [x] 添加 Tabs 滚动样式
  - [x] 所有颜色使用 `vars.less` 变量

---

## Phase 3: History 功能 ✅

### 3.1 创建 History 组件 ✅
- [x] 创建 `Container/History.tsx`
  - [x] 实现 History Panel 布局
  - [x] 实现历史列表渲染（按日期分组：今天、昨天、本周、更早）
  - [x] 实现点击历史项打开新 Tab
  - [x] 实现删除单条历史
  - [x] 实现清空全部历史
  - [x] 实现 Panel 滑入/滑出动画

### 3.2 History 样式 ✅
- [x] 创建 `Container/history.less`
  - [x] 参考 `chatbox/components/History/index.less` 独立实现样式
  - [x] 调整适配 Sidebar 场景
  - [x] 所有颜色使用 `vars.less` 变量

### 3.3 History 存储 ✅
- [x] 在 `index.tsx` 中实现
  - [x] 实现 `loadSidebarHistory` 从 localStorage 读取
  - [x] 实现 `saveSidebarHistory` 保存到 localStorage
  - [x] 在 `addSidebarTab` 中添加历史记录
  - [x] 实现 `handleSidebarHistoryDelete` 删除历史记录
  - [x] 实现 `handleSidebarHistoryClear` 清空历史
  - [x] 限制最大条数 50 条

---

## Phase 4: 内容区改造 ✅

### 4.1 Container 组件改造 ✅
- [x] 修改 `Container/index.tsx`
  - [x] 接收 `tabs` 和 `activeTabId` props
  - [x] 删除导航菜单相关逻辑
  - [x] 根据 `activeTabId` 渲染对应内容
  - [x] 集成 History 和 Empty 组件

### 4.2 空状态组件 ✅
- [x] 创建 `Container/Empty.tsx`
  - [x] 实现空状态占位 UI
  - [x] 显示提示文字："从左侧菜单选择页面开始浏览"
- [x] 创建 `Container/empty.less`

### 4.3 样式调整 ✅
- [x] 修改 `Container/style.less`
  - [x] 删除 `.content` 的 `border-radius: 16px`
  - [x] 删除 `.content` 的 `margin: 16px`
  - [x] 删除 `.content_wrapper` 的 `padding`（让子组件自己控制）
  - [x] 新增 `.sidebar_container`、`.sidebar_main`、`.sidebar_content` 样式

---

## Phase 5: 清理与优化 ✅

### 5.1 删除废弃文件 ✅
- [x] 删除 `Container/Menu.tsx`（Sidebar 内的导航菜单，已移至主菜单）
- [x] 删除 `Container/menu.less`（对应样式文件）
- [x] 删除 `Container/Utils.ts`（不再需要）

### 5.2 事件处理优化 ✅
- [x] `app/openSidebar` 事件正确创建 Tab
- [x] 菜单点击正确触发 Tab 创建
- [x] Tab 切换时同步 URL

### 5.3 样式统一 ✅
- [x] Sidebar Header 与 Chatbox Header 视觉一致
- [x] History Panel 与 Chatbox History 视觉一致
- [x] 所有颜色使用 vars.less 变量

---

## Phase 6: 测试 ✅

### 6.1 Sidebar Tabs 测试
- [x] 从菜单打开页面 → 创建新 Tab
- [x] 从 Action navigate 打开页面 → 创建新 Tab
- [x] 点击 Tab 切换内容
- [x] 关闭 Tab
- [x] 关闭最后一个 Tab → 显示空状态
- [x] Tabs 过多时横向滚动
- [x] History 打开/关闭
- [x] History 点击打开新 Tab
- [x] History 删除/清空

### 6.2 边界情况
- [x] 相同 URL 打开多个 Tab
- [x] 快速连续打开多个 Tab
- [x] Sidebar 最大化状态下的 Tabs
- [x] 窗口 resize 时 Tabs 自适应

### 6.3 兼容性测试
- [x] 现有 navigate Action 正常工作
- [x] localStorage 存储/读取正常
- [x] 暗色主题适配

---

## Phase 7: 主菜单多级支持（可选，独立改造）

> ⚠️ 此 Phase 与 Sidebar Tabs 不耦合，可独立开发，可放到最后做

### 7.1 菜单数据改造
- [ ] 修改 `Menu.tsx`
  - [ ] 改用完整菜单数据 (`global.menus?.items`) 而非只用 `quick_items`
  - [ ] 支持 `children` 子菜单渲染
  - [ ] 实现菜单项展开/收起状态管理

### 7.2 收起模式 (64px) - Hover 弹出子菜单
- [ ] 创建 `SubMenu.tsx` 组件
  - [ ] 实现 hover 触发的弹出面板
  - [ ] 渲染子菜单列表
  - [ ] 支持多级嵌套（递归）
  - [ ] 点击子菜单项打开页面
  - [ ] 可使用 `antd/Tooltip` 显示菜单名称提示
- [ ] 修改 `menu.less`
  - [ ] 弹出面板样式（使用 vars.less 颜色变量）
  - [ ] 弹出动画
  - [ ] 子菜单项样式

### 7.3 展开模式 (240px) - 树形菜单
- [ ] 修改 `Menu.tsx`
  - [ ] 渲染树形菜单结构
  - [ ] 有子菜单的项显示展开/收起箭头
  - [ ] 点击展开/收起子菜单
  - [ ] 子菜单缩进显示
- [ ] 修改 `menu.less`
  - [ ] 展开模式宽度改为 240px
  - [ ] 树形菜单样式
  - [ ] 展开/收起动画
  - [ ] 子菜单缩进样式

### 7.4 测试
- [ ] 收起模式 hover 显示子菜单
- [ ] 展开模式点击展开/收起子菜单
- [ ] 多级菜单正确渲染
- [ ] 菜单项点击打开页面（创建 Tab）
- [ ] 当前页面对应菜单项高亮
- [ ] 菜单展开/收起时布局正确

---

## 备注

### 开发规则 ⚠️
1. **不改变整体风格**：保持现有的视觉风格和设计语言
2. **只使用颜色变量**：所有颜色必须使用 `styles/preset/vars.less` 中的 CSS 变量
3. **不使用 antd 组件**：所有 UI 自行实现（例外：`antd/Tooltip` 可用，`@/widgets/Icon` 可用）
4. **Tabs 与 Chatbox 解耦**：Sidebar Tabs 独立实现，不共享 Chatbox 组件
5. **iframe 使用现有封装**：SUI 页面使用 `pages/web/$.tsx` 渲染，已有通信机制
6. **主菜单独立**：主菜单多级支持与 Sidebar Tabs 不耦合，可独立开发

### 依赖组件
- `@/widgets/Icon` - 图标组件
- `nanoid` - 生成唯一 ID
- `clsx` - className 工具

### 参考实现（仅视觉参考，独立实现）
- `chatbox/components/Header/index.tsx` - Tabs 视觉参考
- `chatbox/components/History/index.tsx` - History 视觉参考
- `chatbox/hooks/tabs.ts` - Tabs 状态管理逻辑参考

### 注意事项
1. 保持与 Chatbox 的视觉一致性（但代码独立）
2. History 存储使用 localStorage，注意容量限制
3. Tab 内容：SUI 页面使用 `pages/web/$.tsx`（iframe），CUI 页面直接渲染
4. 最大化状态下的特殊处理
5. 主菜单展开/收起需要同步更新 CSS 变量 `--menu-width`（现有代码已实现）
6. 子菜单弹出面板需要处理边界情况（靠近屏幕边缘时的位置调整）
7. 切换 Tab 时，非激活 Tab 使用 `display: none` 隐藏，保持状态

---

## 文件变更汇总

### 新增文件
- `Container/types.ts` - 类型定义
- `Container/History.tsx` - History 组件
- `Container/history.less` - History 样式
- `Container/Empty.tsx` - 空状态组件
- `Container/empty.less` - 空状态样式

### 修改文件
- `index.tsx` - 添加 Sidebar Tabs 状态管理
- `Container/index.tsx` - 重构为 Tabs 模式
- `Container/Header.tsx` - 重写为 Tabs Header
- `Container/header.less` - 重写 Header 样式
- `Container/style.less` - 移除圆角和边距

### 删除文件
- `Container/Menu.tsx` - 已删除
- `Container/menu.less` - 已删除
- `Container/Utils.ts` - 已删除
