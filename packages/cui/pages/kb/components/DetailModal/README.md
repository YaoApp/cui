# DetailModal 组件

一个通用的详情页弹窗组件，设计用于与 DataTable 组件配套使用，提供统一的详情展示体验。

## 特性

- 🎨 与 DataTable 组件风格保持一致
- 🌙 完整的 Dark Mode 支持
- 📱 响应式设计，支持多种尺寸
- 🔧 高度可配置，支持自定义字段和布局
- 📋 内置多种字段类型：文本、标签、时间、JSON 等
- 📄 支持可折叠区域和复制功能
- ⚡ TypeScript 完整类型支持

## 基本使用

```tsx
import { DetailModal } from '@/pages/kb/components'
import { DetailSection } from '@/pages/kb/components/DetailModal/types'

const MyComponent = () => {
  const [visible, setVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const sections: DetailSection[] = [
    {
      title: '基本信息',
      fields: [
        {
          key: 'id',
          label: 'ID',
          value: selectedRecord?.id,
          span: 12,
          copyable: true
        },
        {
          key: 'status',
          label: '状态',
          value: selectedRecord?.status,
          span: 12,
          type: 'tag'
        }
      ]
    }
  ]

  return (
    <DetailModal
      visible={visible}
      onClose={() => setVisible(false)}
      title="记录详情"
      data={selectedRecord}
      sections={sections}
      width="60%"
    />
  )
}
```

## 字段类型

### text (默认)
普通文本显示

```tsx
{
  key: 'name',
  label: '名称',
  value: record.name,
  type: 'text'
}
```

### tag
标签样式显示

```tsx
{
  key: 'status',
  label: '状态',
  value: record.status,
  type: 'tag'
}
```

### time
时间格式化显示

```tsx
{
  key: 'created_at',
  label: '创建时间',
  value: record.created_at,
  type: 'time'
}
```

### json
JSON 数据高亮显示

```tsx
{
  key: 'metadata',
  label: '元数据',
  value: record.metadata,
  type: 'json'
}
```

### custom
自定义渲染

```tsx
{
  key: 'score',
  label: '得分',
  value: record.score,
  render: (value) => `${(value * 100).toFixed(2)}%`
}
```

## 可折叠区域

```tsx
{
  title: '详细信息',
  collapsible: true,
  defaultCollapsed: false,
  fields: [
    // ... 字段配置
  ]
}
```

## 操作按钮

```tsx
const actions = [
  {
    key: 'edit',
    label: '编辑',
    icon: <Icon name="material-edit" />,
    onClick: (record) => handleEdit(record)
  },
  {
    key: 'delete',
    label: '删除',
    icon: <Icon name="material-delete" />,
    danger: true,
    onClick: (record) => handleDelete(record)
  }
]

<DetailModal
  // ... 其他属性
  actions={actions}
/>
```

## 自定义内容

如果需要完全自定义内容，可以使用 children：

```tsx
<DetailModal
  visible={visible}
  onClose={onClose}
  title="自定义内容"
  data={record}
>
  <div>
    {/* 自定义内容 */}
  </div>
</DetailModal>
```

## API

### DetailModalProps

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| visible | boolean | - | 是否显示弹窗 |
| onClose | () => void | - | 关闭弹窗回调 |
| title | string | - | 弹窗标题 |
| width | number \| string | '80%' | 弹窗宽度 |
| data | T \| null | - | 数据对象 |
| loading | boolean | false | 加载状态 |
| sections | DetailSection[] | [] | 字段配置 |
| actions | DetailAction[] | [] | 操作按钮 |
| size | 'small' \| 'middle' \| 'large' | 'middle' | 组件尺寸 |
| children | React.ReactNode | - | 自定义内容 |
| onRefresh | () => void | - | 刷新回调 |

### DetailSection

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| title | string | - | 区域标题 |
| fields | DetailField[] | - | 字段列表 |
| collapsible | boolean | false | 是否可折叠 |
| defaultCollapsed | boolean | false | 默认是否折叠 |

### DetailField

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| key | string | - | 字段键 |
| label | string | - | 字段标签 |
| value | any | - | 字段值 |
| span | number | 12 | 栅格占位 (1-24) |
| type | 'text' \| 'tag' \| 'time' \| 'json' \| 'custom' | 'text' | 字段类型 |
| copyable | boolean | false | 是否可复制 |
| render | (value: any, record: any) => React.ReactNode | - | 自定义渲染 |

## 样式变量

组件使用 Neo 设计系统的颜色变量，支持自动的深色模式适配：

- `--color_neo_bg_card`: 卡片背景色
- `--color_neo_bg_header`: 头部背景色  
- `--color_neo_border_card`: 边框颜色
- `--color_neo_text_primary`: 主文本颜色
- `--color_neo_text_secondary`: 次要文本颜色

## 与 DataTable 的配合使用

DetailModal 专门设计用于与 DataTable 组件配合使用：

```tsx
// 在 DataTable 的操作按钮中使用
const actions: TableAction<Record>[] = [
  {
    key: 'view',
    label: '查看详情',
    icon: <Icon name='material-visibility' />,
    onClick: (record) => {
      setSelectedRecord(record)
      setDetailVisible(true)
    }
  }
]

// 详情弹窗
<DetailModal<Record>
  visible={detailVisible}
  onClose={() => setDetailVisible(false)}
  title="记录详情"
  data={selectedRecord}
  sections={detailSections}
/>
```
