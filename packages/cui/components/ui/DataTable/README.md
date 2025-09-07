# DataTable 组件使用说明

## 列宽配置

DataTable 组件支持灵活的列宽配置，不再需要在列定义中硬编码宽度。

### 预设配置

组件提供三种预设的列宽配置：

- `compact`: 紧凑模式，适用于小屏幕
- `normal`: 标准模式，默认配置
- `wide`: 宽屏模式，适用于大屏幕

```tsx
<DataTable
  columns={columns}
  data={data}
  columnWidthPreset="compact" // 使用紧凑模式
/>
```

### 自定义列宽

可以通过 `columnWidths` 属性自定义特定列的宽度：

```tsx
<DataTable
  columns={columns}
  data={data}
  columnWidthPreset="normal"
  columnWidths={{
    query: { flex: 3, minWidth: 300 }, // 查询列占更多空间
    score: { width: 60 }, // 评分列固定60px
    actions: { width: 120 } // 操作列固定120px
  }}
/>
```

### 列宽配置选项

每个列支持以下宽度配置：

- `width`: 固定宽度（数字或字符串，如 `120` 或 `'10%'`）
- `minWidth`: 最小宽度（数字）
- `maxWidth`: 最大宽度（数字）
- `flex`: flex 布局权重（数字，用于自适应宽度）

### 响应式布局

启用 `autoFitColumns` 可以让表格自动适应容器宽度：

```tsx
<DataTable
  columns={columns}
  data={data}
  autoFitColumns={true} // 自动适应容器宽度
  columnWidthPreset="normal"
/>
```

### 使用示例

```tsx
import { DataTable } from '@/pages/kb/components'
import { TableColumn } from '@/components/ui/DataTable/types'

const columns: TableColumn<MyRecord>[] = [
  {
    key: 'name',
    title: '名称',
    dataIndex: 'name'
    // 不需要在这里设置 width
  },
  {
    key: 'description',
    title: '描述',
    dataIndex: 'description',
    ellipsis: true
  }
]

// 在不同场景下使用不同的列宽配置
function MyComponent() {
  return (
    <DataTable
      columns={columns}
      data={data}
      columnWidthPreset="normal"
      columnWidths={{
        name: { width: 150, minWidth: 100 },
        description: { flex: 2, minWidth: 200 }
      }}
      autoFitColumns={true}
    />
  )
}
```

## 优势

1. **外部可控**: 列宽配置完全由使用方控制
2. **预设方便**: 提供常用的预设配置，开箱即用
3. **灵活定制**: 支持细粒度的列宽自定义
4. **响应式**: 支持 flex 布局和自适应宽度
5. **类型安全**: 完整的 TypeScript 类型支持
