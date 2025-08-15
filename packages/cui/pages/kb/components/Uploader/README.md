# Uploader 组件

一个基于 Ant Design Upload 组件的智能文件上传组件，支持根据知识库配置自动计算可上传的文件类型。

## 功能特性

- 🎯 **智能文件类型检测**: 根据 `global.app_info.kb.features` 自动计算支持的文件类型
- 🎨 **两种显示模式**: 支持拖拽区域 (`dragger`) 和按钮 (`button`) 两种模式
- 🌍 **国际化支持**: 自动根据语言环境显示中英文提示
- 🎛️ **完全兼容**: 继承 Ant Design Upload 组件的所有 props
- 🌙 **深色模式**: 自动适配深色主题

## 使用方式

### 基本用法

```tsx
import { Uploader } from '../components'

// 拖拽模式（默认）
<Uploader
  beforeUpload={handleFileUpload}
  showUploadList={false}
/>

// 按钮模式
<Uploader
  mode="button"
  buttonText="选择文件"
  beforeUpload={handleFileUpload}
/>
```

### 高级用法

```tsx
import { Uploader } from '../components'
import { UploadOutlined } from '@ant-design/icons'

<Uploader
  mode="button"
  buttonText="上传文档"
  buttonIcon={<UploadOutlined />}
  showFormatHint={true}
  customFormatHint="支持 PDF、Word、Excel 等格式"
  multiple={false}
  beforeUpload={(file) => {
    console.log('Selected file:', file)
    return false // 阻止默认上传
  }}
/>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `mode` | `'dragger' \| 'button'` | `'dragger'` | 显示模式 |
| `buttonText` | `string` | - | 按钮文本（仅 button 模式） |
| `buttonIcon` | `ReactNode` | `<UploadOutlined />` | 按钮图标（仅 button 模式） |
| `showFormatHint` | `boolean` | `true` | 是否显示格式提示 |
| `customFormatHint` | `string` | - | 自定义格式提示文本 |
| `className` | `string` | - | 自定义样式类名 |
| ...其他 | `UploadProps` | - | 继承 Ant Design Upload 的所有属性 |

## 文件类型支持

组件会根据 `global.app_info.kb.features` 配置自动计算支持的文件类型：

- **PlainText**: `.txt`, `.md`
- **PDFProcessing**: `.pdf`
- **OfficeDocuments**: `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`
- **OCRProcessing / ImageAnalysis**: `.jpg`, `.jpeg`, `.png`, `.bmp`, `.gif`
- **AudioTranscript**: `.mp3`, `.wav`, `.m4a`, `.aac`
- **VideoProcessing**: `.mp4`, `.avi`, `.mov`, `.wmv`

## 样式自定义

组件提供了完整的样式支持，包括：
- 拖拽区域的悬停效果
- 深色模式适配
- 自定义类名支持

```less
// 自定义样式示例
.my-uploader {
  border-radius: 12px;
  
  &:hover {
    border-color: #722ed1;
  }
}
```

## 注意事项

1. 组件会自动限制文件大小为 100MB
2. 需要在应用中正确配置 `global.app_info.kb.features`
3. `beforeUpload` 回调中返回 `false` 可以阻止默认上传行为
