# DataModel 组件

数据模型选择器组件，用于展示和选择数据表模型。

## 功能特性

### 1. 双列布局
- **左侧**：数据集合列表，支持滚动和tooltip显示集合描述
- **右侧**：数据模型卡片列表，支持搜索和选择

### 2. 数据加载
- 自动加载集合列表和数据模型
- 支持Loading状态显示
- 模拟300ms延时的API调用

### 3. 搜索功能
- 实时搜索数据模型的名称、描述和字段
- 支持清空搜索条件

### 4. 模型选择
- 单击选择/取消选择数据模型
- 自动选择关联模型（基于relations配置）
- 取消选择时不影响关联模型

### 5. 字段展示
- 默认显示前3个字段
- 支持展开/收起查看所有字段
- 不同字段类型显示对应图标

### 6. 关联关系
- 显示模型间的关联关系
- 支持hasOne和hasMany两种关系类型

### 7. 详情查看
- 双击模型卡片查看详情（占位功能）
- 详情模态窗（待完善）

### 8. 状态管理
- 选中状态视觉反馈
- 空状态和无搜索结果状态
- 响应式设计适配

## 文件结构

```
DataModel/
├── index.tsx          # 主组件
├── index.less         # 样式文件
├── types.ts           # 类型定义
├── mockData.ts        # 模拟数据
├── DetailModal.tsx    # 详情模态窗（占位）
└── README.md          # 说明文档
```

## 数据结构

### Collection (集合)
```typescript
{
  id: string
  icon: string        // material icon name
  name: string
  description: string
}
```

### Item (数据模型)
```typescript
{
  id: string
  name: string
  icon: string        // material icon name
  collection: string  // Collection ID
  description: string
  relations: Relation[]
  fields: Field[]
}
```

### Field (字段)
```typescript
{
  type: string        // 字段类型
  name: string        // 字段名
  label: string       // 显示标签
}
```

### Relation (关联关系)
```typescript
{
  id: string
  model: string       // 关联模型名
  foreign: string     // 外键字段
  key: string         // 主键字段
  type: 'hasOne' | 'hasMany'
}
```

## 样式特点

- 使用CSS变量支持明暗主题
- 与父组件保持一致的设计风格
- 响应式布局和交互效果
- 平滑的过渡动画
- 自定义滚动条样式

## 交互说明

1. **选择集合**：点击左侧集合项切换到对应的数据模型列表
2. **搜索模型**：在右上角搜索框输入关键词过滤模型
3. **选择模型**：单击模型卡片进行选择，已选中的模型会有视觉标识
4. **展开字段**：点击字段区域的展开/收起按钮查看所有字段
5. **查看详情**：双击模型卡片打开详情模态窗（功能待完善）

## TODO

- [ ] 完善数据模型详情页面
- [ ] 添加字段类型过滤功能
- [ ] 优化大数据量的性能
- [ ] 添加拖拽排序功能
- [ ] 支持批量操作 