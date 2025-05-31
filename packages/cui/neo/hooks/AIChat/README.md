# File Upload Handler

This is a reimplemented file upload handler that supports chunk upload, file type validation, multiple storage backends, and localized error messages.

## Features

### ✅ Implemented Features

1. **Chunk Upload**
   - Automatically detects file size and enables chunk upload when exceeding chunk size
   - Supports configurable chunk size
   - Automatic chunk merging
   - Upload progress monitoring support

2. **File Type Validation**
   - Supports MIME type validation (e.g., `text/*`, `image/*`)
   - Supports file extension validation (e.g., `.pdf`, `.doc`)
   - Special handling for code file types
   - Configurable allowed types list

3. **Multiple Storage Support**
   - `chat`: Chat file storage
   - `assets`: Asset file storage  
   - `knowledge`: Knowledge base file storage
   - Each storage can have different configurations

4. **File Size Limits**
   - Configurable maximum file size
   - Automatic file size validation

5. **Upload Control**
   - Support for canceling individual file uploads
   - Support for canceling all uploads
   - Request control using AbortController

6. **File Download**
   - Support for file downloads
   - Choice between inline or attachment mode
   - No authentication parameters needed for download

7. **Localized Error Messages**
   - Support for English and Chinese error messages
   - Configurable via `is_cn` parameter

## API Interface

### createFileHandlers

Create file handler instance.

```typescript
const fileHandlers = createFileHandlers(
  neo_api: string | undefined,
  storages: App.AgentStorages,
  is_cn?: boolean
)
```

**Parameters:**
- `neo_api`: Neo API endpoint address
- `storages`: Storage configuration object
- `is_cn`: Optional boolean to enable Chinese error messages (default: false)

### Returned Methods

#### uploadTo

Upload file to specified storage.

```typescript
await fileHandlers.uploadTo(
  storage: App.AgentStorageType,
  file: RcFile,
  upload_options: App.UploadOption
): Promise<UploadResponse>
```

**Note:** `chat_id` and `assistant_id` are now passed via `upload_options` instead of the constructor.

#### validateFileType

Validate file type.

```typescript
fileHandlers.validateFileType(
  file: RcFile,
  allowedTypes: string[]
): boolean
```

#### downloadFile

Download file (no authentication parameters needed).

```typescript
await fileHandlers.downloadFile(
  file_id: string,
  disposition?: 'inline' | 'attachment'
): Promise<{ success: boolean }>
```

#### cancelUpload

Cancel upload for specified file.

```typescript
fileHandlers.cancelUpload(fileName: string): void
```

#### cancelAllUploads

Cancel all uploads.

```typescript
fileHandlers.cancelAllUploads(): void
```

## Configuration

### Storage Configuration (AgentStorages)

```typescript
const storages: App.AgentStorages = {
  chat: {
    max_size: 50 * 1024 * 1024,     // Maximum file size (50MB)
    chunk_size: 2 * 1024 * 1024,    // Chunk size (2MB)
    allowed_types: [                 // Allowed file types
      'text/*',
      'image/*',
      'application/pdf',
      '.doc',
      '.docx'
    ]
  },
  assets: {
    max_size: 100 * 1024 * 1024,    // 100MB
    chunk_size: 5 * 1024 * 1024,    // 5MB
    allowed_types: ['image/*', 'video/*', 'audio/*']
  },
  knowledge: {
    max_size: 20 * 1024 * 1024,     // 20MB
    chunk_size: 1 * 1024 * 1024,    // 1MB
    allowed_types: [
      'text/*',
      'application/pdf',
      '.txt',
      '.md',
      '.json'
    ]
  }
}
```

### Upload Options (UploadOption)

```typescript
const uploadOptions: App.UploadOption = {
  compress_image?: boolean,    // Whether to compress images
  compress_size?: number,      // Compressed size
  gzip?: boolean,             // Whether to enable gzip compression
  knowledge?: boolean,        // Whether to push to knowledge base
  chat_id?: string,          // Chat ID (required for upload)
  assistant_id?: string      // Assistant ID (optional)
}
```

## Usage Examples

### Basic Usage

```typescript
import { createFileHandlers } from './fileHandling'

// 1. Configure storage
const storages = { /* storage configuration */ }

// 2. Create handler
const fileHandlers = createFileHandlers(
  'http://localhost:5099/api/__yao/neo',
  storages,
  false // English error messages
)

// 3. Upload file
const uploadFile = async (file: File) => {
  try {
    const result = await fileHandlers.uploadTo('chat', file, {
      compress_image: true,
      gzip: false,
      knowledge: false,
      chat_id: 'chat_123',
      assistant_id: 'assistant_456'
    })
    console.log('Upload successful:', result)
  } catch (error) {
    console.error('Upload failed:', error)
  }
}
```

### Localized Error Messages

```typescript
// English error messages (default)
const englishHandlers = createFileHandlers(neo_api, storages, false)

// Chinese error messages
const chineseHandlers = createFileHandlers(neo_api, storages, true)

try {
  await chineseHandlers.uploadTo('chat', file, uploadOptions)
} catch (error) {
  // Error message will be in Chinese: "文件大小不能超过 50MB"
  console.error(error.message)
}
```

### Chunk Upload

When file size exceeds the configured `chunk_size`, chunk upload is automatically enabled:

```typescript
// Upload large file (>2MB will be chunked automatically)
const uploadLargeFile = async (file: File) => {
  const result = await fileHandlers.uploadTo('assets', file, {
    gzip: true,  // Recommended for large files
    compress_image: false,
    chat_id: 'chat_123',
    assistant_id: 'assistant_456'
  })
  
  // Monitor upload progress
  if (result.progress) {
    console.log(`Progress: ${result.progress.uploaded}/${result.progress.total}`)
  }
}
```

### File Type Validation

```typescript
// Validate file type
const validateFile = (file: File) => {
  const allowedTypes = ['image/*', '.pdf', '.doc']
  const isValid = fileHandlers.validateFileType(file, allowedTypes)
  
  if (!isValid) {
    throw new Error('File type not allowed')
  }
}
```

### File Download

```typescript
// Download file (no chat_id/assistant_id needed)
const downloadFile = async (fileId: string) => {
  try {
    await fileHandlers.downloadFile(fileId, 'attachment')
    console.log('Download successful')
  } catch (error) {
    console.error('Download failed:', error)
  }
}
```

### Cancel Upload

```typescript
// Cancel specific file upload
fileHandlers.cancelUpload('filename.pdf')

// Cancel all uploads
fileHandlers.cancelAllUploads()
```

## Backend Interface

### Upload Endpoint

```
POST /api/__yao/neo/upload/{storage}?token={token}&chat_id={chat_id}&assistant_id={assistant_id}
```

**Headers (for chunk upload):**
- `Content-Range`: `bytes {start}-{end}/{total}`
- `Content-Uid`: `{unique_id}`
- `Content-Sync`: `true` (for last chunk)

**Form Data:**
- `file`: File data
- `option_*`: Upload options (e.g., `option_compress_image=true`)

**Note:** `chat_id` and `assistant_id` are now read from `upload_options` instead of constructor parameters.

### Download Endpoint

```
GET /api/__yao/neo/download?file_id={file_id}&token={token}&disposition={disposition}
```

**Note:** `chat_id` and `assistant_id` parameters have been removed from the download endpoint.

## Error Handling

### English Error Messages (is_cn = false)

1. **File size exceeded**
   ```
   Error: File size cannot exceed 50MB
   ```

2. **File type not supported**
   ```
   Error: File type not supported
   ```

3. **Storage not configured**
   ```
   Error: Storage chat not configured
   ```

4. **API endpoint not configured**
   ```
   Error: Neo API endpoint not configured
   ```

5. **Upload cancelled**
   ```
   Error: Upload cancelled
   ```

### Chinese Error Messages (is_cn = true)

1. **文件大小超限**
   ```
   Error: 文件大小不能超过 50MB
   ```

2. **文件类型不支持**
   ```
   Error: 文件类型不支持
   ```

3. **存储未配置**
   ```
   Error: 存储 chat 未配置
   ```

4. **API端点未配置**
   ```
   Error: Neo API 端点未配置
   ```

5. **上传被取消**
   ```
   Error: 上传已取消
   ```

## Supported File Types

### Code Files
- `.js`, `.ts`, `.jsx`, `.tsx`
- `.py`, `.java`, `.go`, `.rs`
- `.c`, `.cpp`, `.rb`, `.php`, `.swift`
- `.vue`, `.sh`, `.yao`
- `.yml`, `.yaml`, `.mdx`

### Document Files
- `.pdf`, `.doc`, `.docx`, `.odt`
- `.txt`, `.md`, `.json`
- `.xls`, `.xlsx`, `.ppt`, `.pptx`

### Media Files
- `image/*` (all image types)
- `video/*` (all video types)
- `audio/*` (all audio types)

### Wildcard Support
- `text/*` - All text types
- `image/*` - All image types
- `video/*` - All video types
- `audio/*` - All audio types

## Performance Optimization

1. **Chunk Upload**: Large files are automatically chunked to improve upload success rate
2. **Compression Support**: Supports gzip compression to reduce data transfer
3. **Image Compression**: Optional image compression feature
4. **Concurrency Control**: Uses AbortController to manage requests
5. **Error Retry**: Failed chunks can be retried individually

## Notes

1. **Browser Compatibility**: Requires support for `File.slice()` and `AbortController`
2. **Memory Usage**: Be mindful of memory usage when uploading large files in chunks
3. **Network Stability**: Chunk upload provides better fault tolerance for network interruptions
4. **Server Configuration**: Ensure server supports chunk upload and merging
5. **Authentication**: `chat_id` and `assistant_id` are now passed via upload options for better flexibility

## Migration Guide

### From v1.0.0 to v1.1.0

**Breaking Changes:**

1. **Constructor Parameters Changed**
   ```typescript
   // Old API
   createFileHandlers(neo_api, storages, chat_id, assistant_id)
   
   // New API
   createFileHandlers(neo_api, storages, is_cn)
   ```

2. **Upload Options Now Include Authentication**
   ```typescript
   // Old way - passed in constructor
   const handlers = createFileHandlers(api, storages, 'chat_123', 'assistant_456')
   
   // New way - passed in upload options
   const handlers = createFileHandlers(api, storages, false)
   await handlers.uploadTo('chat', file, {
     chat_id: 'chat_123',
     assistant_id: 'assistant_456',
     // ... other options
   })
   ```

3. **Download Simplified**
   ```typescript
   // Old way - required chat_id
   await handlers.downloadFile(fileId, 'attachment') // Would fail if no chat_id in constructor
   
   // New way - no authentication needed
   await handlers.downloadFile(fileId, 'attachment') // Always works
   ```

## Changelog

### v1.1.0
- ✅ Added localized error messages (English/Chinese)
- ✅ Moved `chat_id` and `assistant_id` to upload options
- ✅ Simplified download endpoint (removed authentication)
- ✅ Improved API flexibility and usability

### v1.0.0
- ✅ Implemented chunk upload functionality
- ✅ Implemented file type validation
- ✅ Support for multiple storage backends
- ✅ Implemented upload control and cancellation
- ✅ Implemented file download functionality
- ✅ Added comprehensive error handling
- ✅ Added usage examples and documentation 