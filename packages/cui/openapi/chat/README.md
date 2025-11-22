# Chat API

OpenAPI client for Yao Chat Completions with streaming support.

## Features

- ✅ **Streaming Support**: Real-time SSE (Server-Sent Events) over POST requests
- ✅ **Type Safety**: Full TypeScript type definitions with discriminated unions
- ✅ **Built-in Message Types**: 10 standardized message types with defined Props
- ✅ **Extensible**: Support for custom message types
- ✅ **Browser Native**: Uses fetch() and ReadableStream APIs (no Node.js required)
- ✅ **Cancellable**: Built-in AbortController support

## Quick Start

### Basic Streaming

```typescript
import { OpenAPI, Chat } from '@yao/cui/openapi'

// Initialize
const api = new OpenAPI({ baseURL: '/v1' })
const chat = new Chat(api)

// Stream chat completion
const abort = chat.streamCompletion(
    {
        assistant_id: 'my-assistant',
        messages: [
            { role: 'user', content: 'Hello!' }
        ]
    },
    (chunk) => {
        // Handle each chunk
        console.log(chunk)
    },
    (error) => {
        // Handle errors
        console.error(error)
    }
)

// Cancel if needed
// abort()
```

### With Chat History

```typescript
// Option 1: Generate chat_id on frontend (RECOMMENDED - avoids backend overhead)
// Requirements: Unique string with 8+ characters
import { nanoid } from 'nanoid'

const chatId = nanoid() // e.g., "V1StGXR8_Z5jdHi6B"
// Or use any unique ID generator: UUID, timestamp-based, etc.
// const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// First message in conversation
chat.streamCompletion(
    {
        assistant_id: 'my-assistant',
        chat_id: chatId,  // Use frontend-generated ID
        messages: [
            { role: 'user', content: 'Hello' }
        ]
    },
    (chunk) => { /* ... */ }
)

// Continue conversation - use same chat_id
chat.streamCompletion(
    {
        assistant_id: 'my-assistant',
        chat_id: chatId,  // Same ID for continuation
        messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi! How can I help?' },
            { role: 'user', content: 'Tell me a joke' }
        ]
    },
    (chunk) => { /* ... */ }
)

// Option 2: Let backend auto-detect (omit chat_id)
// Note: This triggers hash computation on backend - use only for stateless clients
chat.streamCompletion(
    {
        assistant_id: 'my-assistant',
        // No chat_id - backend computes hash and matches conversation
        messages: [
            { role: 'user', content: 'Hello' }
        ]
    },
    (chunk) => {
        // Extract backend-generated chat_id from stream_start event
        if (chunk.type === 'event' && chunk.props.event === 'stream_start') {
            const chatId = chunk.props.data?.chat_id
            console.log('Backend generated chat_id:', chatId)
            // Save this for subsequent requests to avoid re-computation
        }
    }
)
```

### With Advanced Options

```typescript
chat.streamCompletion(
    {
        assistant_id: 'my-assistant',
        chat_id: 'chat-123',
        messages: [
            { role: 'user', content: 'Write a poem' }
        ],
        options: {
            temperature: 0.8,
            max_tokens: 1000,
            stop: ['\n\n']
        },
        metadata: {
            user_preference: 'detailed',
            custom_field: 'value'
        }
    },
    (chunk) => { /* ... */ }
)
```

### Multimodal Messages (Vision, Audio)

Send images and audio along with text using multimodal content:

```typescript
// Vision: Analyze an image
chat.streamCompletion(
    {
        assistant_id: 'vision-assistant',
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: 'What is in this image?'
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: 'https://example.com/photo.jpg',
                            detail: 'high'  // 'auto' | 'low' | 'high'
                        }
                    }
                ]
            }
        ]
    },
    (chunk) => { /* ... */ }
)

// Base64 encoded image
chat.streamCompletion(
    {
        assistant_id: 'vision-assistant',
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: 'Describe this diagram' },
                    {
                        type: 'image_url',
                        image_url: {
                            url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
                            detail: 'auto'
                        }
                    }
                ]
            }
        ]
    },
    (chunk) => { /* ... */ }
)

// Audio input
chat.streamCompletion(
    {
        assistant_id: 'audio-assistant',
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'input_audio',
                        input_audio: {
                            data: 'base64_encoded_audio_data',
                            format: 'wav'  // 'wav', 'mp3', etc.
                        }
                    }
                ]
            }
        ]
    },
    (chunk) => { /* ... */ }
)

// Multiple images in one message
chat.streamCompletion(
    {
        assistant_id: 'vision-assistant',
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: 'Compare these two images' },
                    {
                        type: 'image_url',
                        image_url: { url: 'https://example.com/image1.jpg' }
                    },
                    {
                        type: 'image_url',
                        image_url: { url: 'https://example.com/image2.jpg' }
                    }
                ]
            }
        ]
    },
    (chunk) => { /* ... */ }
)

// File attachment (backend support coming soon)
chat.streamCompletion(
    {
        assistant_id: 'document-assistant',
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: 'Analyze this PDF document' },
                    {
                        type: 'file',
                        file: {
                            url: 'https://example.com/document.pdf',
                            filename: 'report.pdf',
                            mime_type: 'application/pdf'
                        }
                    }
                ]
            }
        ]
    },
    (chunk) => { /* ... */ }
)
```

> **Note**: The `file` content type is currently supported in frontend types but backend implementation is planned for a future release.

### File Upload Integration

Complete example showing how to upload files (images, audio, documents) using FileAPI and then send to Chat API:

```typescript
import { OpenAPI, Chat, FileAPI } from '@yao/cui/openapi'
import { CreateFileWrapper, ResolveFileURL } from '@/utils/fileWrapper'

const api = new OpenAPI({ baseURL: '/v1' })
const chat = new Chat(api)

// Upload an image and send to chat
async function uploadAndSendImage(file: File, userMessage: string) {
    try {
        // 1. Upload file using FileAPI
        const fileapi = new FileAPI(api, '__yao.attachment')
        
        const uploadResponse = await fileapi.Upload(
            file,
            {
                uploaderID: '__yao.attachment',
                originalFilename: file.name,
                compressImage: true,      // Enable image compression
                compressSize: 1024,       // Max size 1024px
                public: true              // Public access for sharing
            },
            (progress) => {
                console.log(`Upload progress: ${progress.percentage}%`)
            }
        )

        if (api.IsError(uploadResponse)) {
            throw new Error(uploadResponse.error?.error_description || 'Upload failed')
        }

        const fileId = uploadResponse.data?.file_id
        const fileUrl = uploadResponse.data?.user_path || uploadResponse.data?.path
        
        if (!fileId) {
            throw new Error('File ID not returned from upload')
        }

        // 2. Create file wrapper: uploader_id://file_id
        const fileWrapper = CreateFileWrapper('__yao.attachment', fileId)
        // fileWrapper format: "__yao.attachment://abc123"

        // 3. Send to chat with file wrapper URL (no need to resolve)
        chat.streamCompletion(
            {
                assistant_id: 'vision-assistant',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: userMessage },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: fileWrapper,  // Use wrapper directly
                                    detail: 'high'
                                }
                            }
                        ]
                    }
                ]
            },
            (chunk) => {
                console.log('Response:', chunk)
            },
            (error) => {
                console.error('Chat error:', error)
            }
        )

        return { fileId, fileWrapper }
    } catch (error) {
        console.error('Upload or chat error:', error)
        throw error
    }
}

// Upload audio and send to chat
async function uploadAndSendAudio(audioFile: File, instructions: string) {
    try {
        const fileapi = new FileAPI(api, '__yao.attachment')
        
        const uploadResponse = await fileapi.Upload(
            audioFile,
            {
                uploaderID: '__yao.attachment',
                originalFilename: audioFile.name,
                public: true
            },
            (progress) => console.log(`Upload: ${progress.percentage}%`)
        )

        if (api.IsError(uploadResponse)) {
            throw new Error('Audio upload failed')
        }

        const fileId = uploadResponse.data?.file_id
        if (!fileId) throw new Error('No file ID returned')

        // Create file wrapper for audio
        const fileWrapper = CreateFileWrapper('__yao.attachment', fileId)
        const format = audioFile.name.split('.').pop() || 'wav'

        chat.streamCompletion(
            {
                assistant_id: 'audio-assistant',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'input_audio',
                                input_audio: {
                                    data: fileWrapper,  // Use wrapper directly, not base64
                                    format: format
                                }
                            }
                        ]
                    }
                ]
            },
            (chunk) => console.log('Response:', chunk)
        )

        return { fileId, fileWrapper }
    } catch (error) {
        console.error('Audio upload error:', error)
        throw error
    }
}

// Upload PDF document and send to chat
async function uploadAndSendPDF(pdfFile: File, question: string) {
    try {
        const fileapi = new FileAPI(api, '__yao.attachment')
        
        const uploadResponse = await fileapi.Upload(
            pdfFile,
            {
                uploaderID: '__yao.attachment',
                originalFilename: pdfFile.name,
                public: false  // Documents may contain sensitive data
            },
            (progress) => console.log(`Upload: ${progress.percentage}%`)
        )

        if (api.IsError(uploadResponse)) {
            throw new Error('PDF upload failed')
        }

        const fileId = uploadResponse.data?.file_id
        if (!fileId) throw new Error('No file ID returned')

        // Create file wrapper
        const fileWrapper = CreateFileWrapper('__yao.attachment', fileId)

        chat.streamCompletion(
            {
                assistant_id: 'document-assistant',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: question },
                            {
                                type: 'file',
                                file: {
                                    url: fileWrapper,
                                    filename: pdfFile.name,
                                    mime_type: 'application/pdf'
                                }
                            }
                        ]
                    }
                ]
            },
            (chunk) => console.log('Response:', chunk)
        )

        return { fileId, fileWrapper }
    } catch (error) {
        console.error('PDF upload error:', error)
        throw error
    }
}

// Usage examples
const imageInput = document.querySelector('#image-input')
imageInput?.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
        await uploadAndSendImage(file, 'Describe this image')
    }
})

const pdfInput = document.querySelector('#pdf-input')
pdfInput?.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
        await uploadAndSendPDF(file, 'Summarize this document')
    }
})
```

**Key Points:**

1. **Upload First**: Use `FileAPI.Upload()` to upload files to the server
2. **Get File ID**: Extract `file_id` from upload response
3. **Create Wrapper**: Use `CreateFileWrapper(uploaderID, fileId)` to create wrapper format (`uploader_id://file_id`)
4. **Use Wrapper Directly**: Pass the wrapper string directly to `url`, `data`, or `file` fields - no need to resolve or convert to base64
5. **Backend Handles It**: Backend automatically resolves the wrapper format to actual file paths
6. **Compression**: Enable `compressImage` for images to reduce size and improve performance

**Wrapper Format:**
```typescript
const fileWrapper = CreateFileWrapper('__yao.attachment', 'abc123')
// Result: "__yao.attachment://abc123"

// Use directly in all ContentPart types:
// - image_url.url: "__yao.attachment://abc123"
// - input_audio.data: "__yao.attachment://abc123"
// - file.url: "__yao.attachment://abc123"
```

### Using Model ID Instead of Assistant ID (OpenAI Compatibility)

For OpenAI API compatibility, you can use `model` field instead of `assistant_id`. The backend extracts the assistant ID from the model string using the format: `*-yao_assistantID`

```typescript
chat.streamCompletion(
    {
        // Model format: [prefix-]modelName-yao_assistantID
        model: 'gpt-4o-yao_myassistant',  // Backend extracts "myassistant"
        messages: [
            { role: 'user', content: 'Hello!' }
        ]
    },
    (chunk) => { /* ... */ }
)

// More examples:
// "claude-3-sonnet-yao_chatbot" → assistant_id: "chatbot"
// "gpt-4-turbo-yao_support_agent" → assistant_id: "support_agent"
```

> **Note**: The backend splits the model string by `-yao_` and takes the last part as the assistant_id.

## Request Parameters

### ChatCompletionRequest

The request object uses TypeScript discriminated unions to enforce that either `assistant_id` or `model` must be provided:

```typescript
// Option 1: With assistant_id (recommended for Yao apps)
const request1: ChatCompletionRequest = {
    assistant_id: 'my-assistant',  // Direct assistant reference
    messages: [{ role: 'user', content: 'Hi' }],
    model?: 'gpt-4o',  // Optional: for OpenAI compatibility
    chat_id?: 'chat-123',
    options?: { temperature: 0.7 },
    metadata?: { custom: 'data' }
}

// Option 2: With model only (OpenAI compatibility mode)
const request2: ChatCompletionRequest = {
    model: 'gpt-4o-yao_myassistant',  // Model with embedded assistant_id
    messages: [{ role: 'user', content: 'Hi' }],
    assistant_id?: 'fallback',  // Optional: takes priority if provided
    chat_id?: 'chat-123',
    options?: { temperature: 0.7 }
}
```

**Required Fields:**
- `messages`: Array of chat messages
- `assistant_id` OR `model`: At least one must be provided
  - `assistant_id`: Direct assistant reference (recommended)
  - `model`: OpenAI-compatible model identifier with format `*-yao_assistantID`

**Optional Fields:**
- `chat_id`: Continue existing chat session
  - **Optional**: Can be omitted for automatic conversation detection
  - **Auto-detection**: Backend automatically indexes conversations by message history
    - Matches previous messages (excluding assistant responses) via SHA256 hash
    - Same message history → Same `chat_id` (conversation continuation)
    - New message history → New `chat_id` (new conversation)
  - **Frontend can generate**: Any unique string with 8+ characters
  - **Purpose**: Links messages in the same conversation for context continuity
- `options`: OpenAI-compatible parameters (temperature, max_tokens, etc.)
- `metadata`: Custom metadata object

**Backend Parameter Extraction Priority:**

`assistant_id`:
1. Query parameter `?assistant_id=xxx`
2. HTTP Header `X-Yao-Assistant: xxx`
3. Extract from `model` field (splits by `-yao_` and takes last part)

`chat_id`:
1. Query parameter `?chat_id=xxx`
2. HTTP Header `X-Yao-Chat: xxx`
3. Request body `metadata.chat_id`
4. **Auto-detect from message history**
   - Hashes non-assistant messages (system, developer, user, tool)
   - Matches against cached conversations (7-day TTL)
   - Same history → Same `chat_id` (continuation)
   - New history → Generate new `chat_id`

> **Note**: 
> - The frontend uses HTTP headers (`X-Yao-Assistant` and `X-Yao-Chat`) to send these parameters.
> - **Recommendation**: Generate `chat_id` on frontend to avoid backend hash computation overhead. Auto-detection is a fallback for clients without state management.

### Delta Merging Example

The Message DSL supports 4 delta actions for incremental updates:

- **`append`**: Append to arrays or strings (default for text streaming)
- **`replace`**: Replace entire value
- **`merge`**: Deep merge objects
- **`set`**: Set new field values

```typescript
import { Message } from '@yao/cui/openapi'

// Message cache for merging deltas
const messageCache = new Map<string, any>()

function applyDelta(msgId: string, chunk: Message): any {
    // Get or initialize message state
    let current = messageCache.get(msgId)
    if (!current) {
        current = { type: chunk.type, props: {} }
        messageCache.set(msgId, current)
    }
    
    if (!chunk.delta) {
        // Not a delta, use as-is
        current.props = chunk.props
        return current
    }
    
    // Get target path (default to entire props)
    const path = chunk.delta_path || ''
    const action = chunk.delta_action || 'append'
    
    // Apply delta based on action
    switch (action) {
        case 'append':
            // Append to string or array
            if (path) {
                const target = getValueByPath(current.props, path)
                if (typeof target === 'string') {
                    setValueByPath(current.props, path, target + chunk.props[path])
                } else if (Array.isArray(target)) {
                    target.push(...(Array.isArray(chunk.props[path]) ? chunk.props[path] : [chunk.props[path]]))
                }
            } else {
                // Append to root level (e.g., content field)
                Object.keys(chunk.props).forEach(key => {
                    if (typeof current.props[key] === 'string') {
                        current.props[key] = (current.props[key] || '') + chunk.props[key]
                    } else {
                        current.props[key] = chunk.props[key]
                    }
                })
            }
            break
            
        case 'replace':
            // Replace entire value at path
            if (path) {
                setValueByPath(current.props, path, getValueByPath(chunk.props, path))
            } else {
                current.props = chunk.props
            }
            break
            
        case 'merge':
            // Deep merge objects
            if (path) {
                const target = getValueByPath(current.props, path)
                const source = getValueByPath(chunk.props, path)
                setValueByPath(current.props, path, deepMerge(target, source))
            } else {
                current.props = deepMerge(current.props, chunk.props)
            }
            break
            
        case 'set':
            // Set new field
            if (path) {
                setValueByPath(current.props, path, getValueByPath(chunk.props, path))
            } else {
                Object.assign(current.props, chunk.props)
            }
            break
    }
    
    return current
}

// Helper functions
function getValueByPath(obj: any, path: string): any {
    if (!path) return obj
    return path.split('.').reduce((acc, part) => {
        const match = part.match(/^(\w+)(\[(\d+)\])?$/)
        if (match) {
            const [, key, , index] = match
            return index !== undefined ? acc?.[key]?.[parseInt(index)] : acc?.[key]
        }
        return acc?.[part]
    }, obj)
}

function setValueByPath(obj: any, path: string, value: any): void {
    if (!path) return
    const parts = path.split('.')
    const last = parts.pop()!
    const target = parts.reduce((acc, part) => {
        const match = part.match(/^(\w+)(\[(\d+)\])?$/)
        if (match) {
            const [, key, , index] = match
            if (index !== undefined) {
                acc[key] = acc[key] || []
                return acc[key][parseInt(index)]
            }
            acc[key] = acc[key] || {}
            return acc[key]
        }
        acc[part] = acc[part] || {}
        return acc[part]
    }, obj)
    
    const match = last.match(/^(\w+)(\[(\d+)\])?$/)
    if (match) {
        const [, key, , index] = match
        if (index !== undefined) {
            target[key] = target[key] || []
            target[key][parseInt(index)] = value
        } else {
            target[key] = value
        }
    }
}

function deepMerge(target: any, source: any): any {
    if (!source) return target
    if (!target) return source
    if (typeof target !== 'object' || typeof source !== 'object') return source
    
    const result = Array.isArray(target) ? [...target] : { ...target }
    for (const key in source) {
        if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(result[key], source[key])
        } else {
            result[key] = source[key]
        }
    }
    return result
}

// Usage
chat.streamCompletion(
    {
        assistant_id: 'my-assistant',
        messages: [{ role: 'user', content: 'Tell me a story' }]
    },
    (chunk) => {
        if (chunk.id) {
            const merged = applyDelta(chunk.id, chunk)
            
            // Update UI with merged state
            updateMessageUI(chunk.id, merged)
            
            // Clean up when done
            if (chunk.done) {
                messageCache.delete(chunk.id)
            }
        }
    }
)
```

**Delta Action Examples:**

```typescript
// Append: Streaming text content (most common)
{ id: "msg-1", delta: true, delta_action: "append", props: { content: "Hello" } }
{ id: "msg-1", delta: true, delta_action: "append", props: { content: " world" } }
// Result: { content: "Hello world" }

// Replace: Update entire field
{ id: "msg-2", delta: true, delta_action: "replace", delta_path: "status", props: { status: "processing" } }
{ id: "msg-2", delta: true, delta_action: "replace", delta_path: "status", props: { status: "completed" } }
// Result: { status: "completed" }

// Merge: Combine objects
{ id: "msg-3", delta: true, delta_action: "merge", props: { metadata: { step: 1 } } }
{ id: "msg-3", delta: true, delta_action: "merge", props: { metadata: { progress: 50 } } }
// Result: { metadata: { step: 1, progress: 50 } }

// Set: Add new fields
{ id: "msg-4", delta: true, delta_action: "set", delta_path: "items.0.name", props: { items: [{ name: "Item 1" }] } }
{ id: "msg-4", delta: true, delta_action: "set", delta_path: "items.1.name", props: { items: [null, { name: "Item 2" }] } }
// Result: { items: [{ name: "Item 1" }, { name: "Item 2" }] }
```

### Component Rendering Example

Render different message types with corresponding UI components, handling delta updates:

```typescript
import { 
    Message, 
    IsTextMessage,
    IsThinkingMessage,
    IsImageMessage, 
    IsErrorMessage,
    IsLoadingMessage,
    IsToolCallMessage 
} from '@yao/cui/openapi'

// Message state cache for delta merging
const messageStates = new Map<string, any>()

function renderMessage(msg: Message, mergedProps: any): HTMLElement {
    // Text message - render as markdown
    if (IsTextMessage(msg)) {
        const div = document.createElement('div')
        div.className = 'message-text'
        div.innerHTML = marked(mergedProps.content || '') // Use markdown parser
        
        // Add streaming indicator for delta messages
        if (msg.delta && !msg.done) {
            div.classList.add('streaming')
        }
        return div
    }
    
    // Thinking message - render with special styling
    if (IsThinkingMessage(msg)) {
        const div = document.createElement('div')
        div.className = 'message-thinking'
        div.innerHTML = `
            <div class="thinking-icon">💭</div>
            <div class="thinking-content">${mergedProps.content || ''}</div>
        `
        if (msg.delta && !msg.done) {
            div.classList.add('streaming')
        }
        return div
    }
    
    // Image message - render as img tag
    if (IsImageMessage(msg)) {
        const img = document.createElement('img')
        img.src = mergedProps.url
        img.alt = mergedProps.alt || 'Image'
        if (mergedProps.width) img.width = mergedProps.width
        if (mergedProps.height) img.height = mergedProps.height
        img.className = 'message-image'
        return img
    }
    
    // Loading message - render as spinner
    if (IsLoadingMessage(msg)) {
        const div = document.createElement('div')
        div.className = 'message-loading'
        div.innerHTML = `
            <div class="spinner"></div>
            <span>${mergedProps.message || 'Loading...'}</span>
        `
        return div
    }
    
    // Tool call message - render as code block
    if (IsToolCallMessage(msg)) {
        const pre = document.createElement('pre')
        pre.className = 'message-tool-call'
        pre.innerHTML = `
            <strong>Tool:</strong> ${mergedProps.name || ''}
            ${mergedProps.arguments ? `<code>${mergedProps.arguments}</code>` : ''}
        `
        if (msg.delta && !msg.done) {
            pre.classList.add('streaming')
        }
        return pre
    }
    
    // Error message - render with error styling
    if (IsErrorMessage(msg)) {
        const div = document.createElement('div')
        div.className = 'message-error'
        div.innerHTML = `
            <strong>Error:</strong> ${mergedProps.message || 'Unknown error'}
            ${mergedProps.code ? `<code>${mergedProps.code}</code>` : ''}
        `
        return div
    }
    
    // Custom message type - render as JSON
    const div = document.createElement('div')
    div.className = `message-custom message-${msg.type}`
    div.innerHTML = `
        <strong>Type:</strong> ${msg.type}
        <pre>${JSON.stringify(mergedProps, null, 2)}</pre>
    `
    return div
}

function applyDelta(msgId: string, msg: Message): any {
    let state = messageStates.get(msgId)
    
    if (!msg.delta) {
        // Not a delta, use props directly
        state = { ...msg.props }
        messageStates.set(msgId, state)
        return state
    }
    
    // Initialize state if first delta
    if (!state) {
        state = {}
        messageStates.set(msgId, state)
    }
    
    // Apply delta based on action
    const action = msg.delta_action || 'append'
    const path = msg.delta_path || ''
    
    if (action === 'append' && !path) {
        // Simple append for content fields (most common case)
        Object.keys(msg.props).forEach(key => {
            if (typeof msg.props[key] === 'string') {
                state[key] = (state[key] || '') + msg.props[key]
            } else {
                state[key] = msg.props[key]
            }
        })
    } else {
        // Handle other delta actions (replace, merge, set)
        // See "Delta Merging Example" for full implementation
        Object.assign(state, msg.props)
    }
    
    return state
}

// Usage in streaming with delta handling and type changes
chat.streamCompletion(
    {
        assistant_id: 'my-assistant',
        messages: [{ role: 'user', content: 'Explain quantum computing' }]
    },
    (chunk) => {
        const container = document.getElementById('messages')
        if (!container) return
        
        // Skip event messages
        if (chunk.type === 'event') return
        
        const msgId = chunk.id || `msg-${Date.now()}`
        
        // Handle type change: backend corrected the message type
        if (chunk.type_change) {
            // In streaming, backend may not know final type until enough data is received
            // Examples: loading → text, text → image, loading → error
            // Clear old state and re-render with correct component type
            messageStates.delete(msgId)
            const element = renderMessage(chunk, chunk.props || {})
            element.id = `msg-${msgId}`
            
            const existing = document.getElementById(`msg-${msgId}`)
            if (existing) {
                // Replace with new component type
                existing.replaceWith(element)
            } else {
                container.appendChild(element)
            }
            
            // Store new state for future deltas
            if (chunk.props) {
                messageStates.set(msgId, { ...chunk.props })
            }
            return
        }
        
        // Normal delta handling
        const mergedProps = applyDelta(msgId, chunk)
        
        // Render with merged state
        const element = renderMessage(chunk, mergedProps)
        element.id = `msg-${msgId}`
        
        // Update or append element
        const existing = document.getElementById(`msg-${msgId}`)
        if (existing) {
            existing.replaceWith(element)
        } else {
            container.appendChild(element)
        }
        
        // Clean up state when message is done
        if (chunk.done) {
            messageStates.delete(msgId)
            element.classList.remove('streaming')
            element.classList.add('complete')
        }
    }
)
```

**Key Points for Delta Rendering:**

1. **State Management**: Use `messageStates` Map to cache merged props for each message ID
2. **Delta Merging**: Call `applyDelta()` to merge incremental updates before rendering
3. **Type Change Handling**: When `type_change: true`, clear old state and re-render with new component type
   - **Why type changes occur**: In streaming, the backend may not know the final message type until enough data is received or processing is complete
   - **Common scenarios**:
     - `loading` → `text`: Started with loading indicator, now determined it's text output
     - `loading` → `image`: Processing complete, result is an image
     - `loading` → `error`: Processing failed during execution
     - `text` → `image`: Initially thought it's text, but generated an image
     - `text` → `video`: Content generation resulted in a video
   - **How to handle**: Clear old component state, replace with new component type's renderer
4. **Visual Feedback**: Add `.streaming` class during delta updates, `.complete` when done
5. **Content Types**: Handle both simple text streaming and complex structured updates
6. **Cleanup**: Remove state from cache when `done: true` is received

## Message Types

The Chat API uses a universal message DSL that supports 10 built-in types and unlimited custom types.

### Built-in Types

| Type | Constant | Props | Description |
|------|----------|-------|-------------|
| `text` | `MessageType.TEXT` | `TextProps` | Text or Markdown content |
| `thinking` | `MessageType.THINKING` | `ThinkingProps` | Reasoning process (e.g., o1 models) |
| `loading` | `MessageType.LOADING` | `LoadingProps` | Loading indicator |
| `tool_call` | `MessageType.TOOL_CALL` | `ToolCallProps` | Function/tool call |
| `error` | `MessageType.ERROR` | `ErrorProps` | Error message |
| `image` | `MessageType.IMAGE` | `ImageProps` | Image content |
| `audio` | `MessageType.AUDIO` | `AudioProps` | Audio content |
| `video` | `MessageType.VIDEO` | `VideoProps` | Video content |
| `action` | `MessageType.ACTION` | `ActionProps` | System action (CUI only) |
| `event` | `MessageType.EVENT` | `EventProps` | Lifecycle event (CUI only) |

#### Event Types

Event messages (`type: 'event'`) use standardized event constants in their `props.event` field. Each event type has its own structured data format:

| Event | Constant | Data Type | Description |
|-------|----------|-----------|-------------|
| `stream_start` | `EventType.STREAM_START` | `StreamStartData` | Stream has started |
| `stream_end` | `EventType.STREAM_END` | `StreamEndData` | Stream has ended |
| `group_start` | `EventType.GROUP_START` | `GroupStartData` | Message group has started |
| `group_end` | `EventType.GROUP_END` | `GroupEndData` | Message group has ended |

**Event Data Structures:**

```typescript
import { 
    EventType, 
    EventMessage, 
    StreamStartData,
    StreamEndData,
    IsStreamStartEvent,
    IsStreamEndEvent 
} from '@yao/cui/openapi'

// Stream start event with typed data
const streamStartEvent: EventMessage = {
    type: MessageType.EVENT,
    props: {
        event: EventType.STREAM_START,
        message: 'Stream started',
        data: {
            request_id: 'req-123',
            timestamp: 1234567890,
            chat_id: 'chat-456',
            trace_id: 'trace-789',
            assistant: {
                assistant_id: 'my-assistant',
                name: 'My Assistant',
                avatar: 'https://...'
            }
        }
    }
}

// Stream end event with usage statistics
const streamEndEvent: EventMessage = {
    type: MessageType.EVENT,
    props: {
        event: EventType.STREAM_END,
        data: {
            request_id: 'req-123',
            timestamp: 1234567890,
            duration_ms: 1500,
            status: 'completed',
            usage: {
                prompt_tokens: 100,
                completion_tokens: 50,
                total_tokens: 150
            }
        }
    }
}

// Type guards for specific event types
if (IsEventMessage(msg) && IsStreamStartEvent(msg)) {
    // TypeScript knows msg.props.data is StreamStartData
    console.log(msg.props.data.assistant?.name)
    console.log(msg.props.data.request_id)
}

if (IsEventMessage(msg) && IsStreamEndEvent(msg)) {
    // TypeScript knows msg.props.data is StreamEndData
    console.log(msg.props.data.usage?.total_tokens)
    console.log(msg.props.data.duration_ms)
}
```

### TypeScript Autocomplete for Built-in Types

When using built-in message types, TypeScript provides autocomplete for the `props` field based on the `type` value. The API uses discriminated unions for type safety:

```typescript
import { MessageType, TextMessage, EventMessage } from '@yao/cui/openapi'

// TypeScript knows this is a TextMessage and provides autocomplete for TextProps
const textMsg: TextMessage = {
    type: MessageType.TEXT,
    props: {
        content: 'Hello' // Autocomplete suggests 'content'
    }
}

// TypeScript knows this is an EventMessage and provides autocomplete for EventProps
const eventMsg: EventMessage = {
    type: MessageType.EVENT,
    props: {
        event: 'stream_start', // Autocomplete suggests 'event', 'message', 'data'
        message: 'Stream started'
    }
}
```

You can also use type guards to narrow down types at runtime:

```typescript
function handleMessage(msg: Message) {
    if (IsTextMessage(msg)) {
        // TypeScript knows msg.props is TextProps
        console.log(msg.props.content) // Autocomplete works!
    }
    
    if (IsEventMessage(msg)) {
        // TypeScript knows msg.props is EventProps
        console.log(msg.props.event, msg.props.message) // Autocomplete works!
    }
}
```

### Custom Types

The message type system is fully extensible. You can use any string as a type:

```typescript
const customMessage: Message = {
    type: 'shopping_cart',
    props: {
        items: [/* ... */],
        total: 99.99
    }
}
```

> **Note**: Custom types require corresponding frontend components to render.

## Streaming Events

### Stream Lifecycle

All chunks received are `Message` objects. The backend converts internal chunk types to Messages before sending.

```typescript
import { 
    MessageType, 
    EventType, 
    IsTextMessage, 
    IsEventMessage,
    IsStreamStartEvent,
    IsStreamEndEvent 
} from '@yao/cui/openapi'

chat.streamCompletion({ 
    assistant_id: 'my-assistant', 
    messages: [{ role: 'user', content: 'Hello' }] 
}, (chunk) => {
    // All chunks are Message objects
    console.log('Chunk type:', chunk.type)
    
    // Check for lifecycle events with typed event guards
    if (IsEventMessage(chunk)) {
        if (IsStreamStartEvent(chunk)) {
            // TypeScript knows chunk.props.data is StreamStartData
            console.log('Stream started:', chunk.props.data?.assistant?.name)
            console.log('Request ID:', chunk.props.data?.request_id)
        }
        else if (IsStreamEndEvent(chunk)) {
            // TypeScript knows chunk.props.data is StreamEndData
            console.log('Stream ended. Tokens:', chunk.props.data?.usage?.total_tokens)
            console.log('Duration:', chunk.props.data?.duration_ms, 'ms')
        }
        else {
            // Other event types (GROUP_START, GROUP_END, custom events)
            console.log('Event:', chunk.props.event)
        }
        return
    }
    
    // Check for content messages
    if (IsTextMessage(chunk)) {
        if (chunk.delta) {
            // Streaming delta
            process.stdout.write(chunk.props.content)
        } else if (chunk.done) {
            // Complete message
            console.log('\nFinal:', chunk.props.content)
        }
        return
    }
    
    // Handle other message types
    handleMessage(chunk)
})
```

### Handling Messages

```typescript
import { 
    MessageType,
    IsTextMessage, 
    IsThinkingMessage,
    IsImageMessage
} from '@yao/cui/openapi'

function handleMessage(msg: Message) {
    // Type guards provide type safety
    if (IsTextMessage(msg)) {
        console.log('Text:', msg.props.content)
        return
    }
    
    if (IsThinkingMessage(msg)) {
        console.log('Thinking:', msg.props.content)
        return
    }
    
    if (IsImageMessage(msg)) {
        console.log('Image:', msg.props.url)
        return
    }
    
    // Or use constants
    switch (msg.type) {
        case MessageType.ERROR:
            console.error('Error:', msg.props.message)
            break
        case MessageType.LOADING:
            console.log('Loading:', msg.props.message)
            break
        // Custom types
        case 'shopping_cart':
            renderShoppingCart(msg.props)
            break
        default:
            console.warn('Unknown type:', msg.type)
    }
}
```

## Delta Updates (Streaming)

Messages support incremental updates for streaming scenarios:

```typescript
// First chunk
{
    id: 'msg_123',
    type: 'text',
    delta: true,
    props: { content: 'Hello' }
}

// Subsequent chunks (append to same ID)
{
    id: 'msg_123',
    type: 'text',
    delta: true,
    props: { content: ', world' }
}

// Final chunk
{
    id: 'msg_123',
    type: 'text',
    delta: true,
    done: true,
    props: { content: '!' }
}
```

### Delta Actions

For complex structured messages:

```typescript
{
    id: 'msg_456',
    type: 'table',
    delta: true,
    delta_path: 'rows',          // Which field to update
    delta_action: 'append',      // How to update: 'append', 'replace', 'merge', 'set'
    props: {
        rows: [{ name: 'Alice', age: 30 }]
    }
}
```

## Message Grouping

Related messages are grouped using markers in the Message fields:

```typescript
// Group start (type='event', props.event='group_start')
{
    type: 'event',
    props: {
        event: 'group_start',
        data: { group_id: 'grp_001' }
    }
}

// Messages in group
{
    id: 'msg_123',
    type: 'image',
    group_id: 'grp_001',  // ← Belongs to group
    props: { url: 'photo.jpg', alt: 'Sunset' }
}
{
    id: 'msg_124',
    type: 'text',
    group_id: 'grp_001',  // ← Belongs to group
    props: { content: 'Captured at Golden Gate Bridge' }
}

// Group end (type='event', props.event='group_end')
{
    type: 'event',
    props: {
        event: 'group_end',
        data: { group_id: 'grp_001' }
    }
}
```

### Handling Groups

```typescript
let currentGroup: Message[] = []
let inGroup = false

chat.StreamCompletion({ ... }, (chunk) => {
    if (IsEventMessage(chunk)) {
        if (chunk.props.event === 'group_start') {
            inGroup = true
            currentGroup = []
        } else if (chunk.props.event === 'group_end') {
            // Process complete group
            console.log('Group complete:', currentGroup.length, 'messages')
            renderGroup(currentGroup)
            inGroup = false
            currentGroup = []
        }
        return
    }
    
    if (inGroup) {
        currentGroup.push(chunk)
    } else {
        // Individual message
        renderMessage(chunk)
    }
})
```

## API Design

### User-Friendly Request Structure

The request structure requires **either `assistant_id` or `model`** (or both). This is enforced via TypeScript discriminated union:

```typescript
// Option 1: Use assistant_id directly (recommended)
interface ChatCompletionRequestWithAssistant {
    assistant_id: string        // Required: Which assistant to use
    messages: ChatMessage[]     // Required: Chat messages
    chat_id?: string           // Optional: Continue existing chat
    model?: string             // Optional: Can provide model additionally
    options?: ChatCompletionOptions
    metadata?: Record<string, any>
}

// Option 2: Use model with embedded assistant_id (OpenAI compatibility)
interface ChatCompletionRequestWithModel {
    model: string              // Required: Model ID (format: *-yao_assistantID)
    messages: ChatMessage[]     // Required: Chat messages
    chat_id?: string           // Optional: Continue existing chat
    assistant_id?: string      // Optional: Can provide assistant_id additionally
    options?: ChatCompletionOptions
    metadata?: Record<string, any>
}

// Final type is a union - at least one of assistant_id or model must be provided
type ChatCompletionRequest = 
    | ChatCompletionRequestWithAssistant 
    | ChatCompletionRequestWithModel
```

**Key Points:**
- **At least one required**: Must provide either `assistant_id` or `model` (or both)
- **Backend priority**: If both are provided, `assistant_id` takes precedence
- **Model format**: When using `model`, format is `*-yao_assistantID` (e.g., `gpt-4o-yao_myassistant`)
- **TypeScript enforcement**: Compiler ensures you provide at least one

### How It Works

The API automatically handles parameter routing:

1. **URL**: `/chat/completions` (fixed endpoint)
2. **`assistant_id`** → HTTP header: `X-Yao-Assistant: xxx` (if provided in request)
3. **`chat_id`** → HTTP header: `X-Yao-Chat: xxx` (if provided)
4. **`model`** → Request body (used for `assistant_id` extraction if header not provided)
5. **`options`** → Merged into request body
6. **`metadata`** → Request body metadata field

### Examples

```typescript
// Simple request
chat.streamCompletion({
    assistant_id: 'my-assistant',
    messages: [{ role: 'user', content: 'Hi' }]
})

// With chat history
chat.streamCompletion({
    assistant_id: 'my-assistant',
    chat_id: 'chat-123',
    messages: [{ role: 'user', content: 'Continue our discussion' }]
})

// With advanced options
chat.streamCompletion({
    assistant_id: 'my-assistant',
    messages: [{ role: 'user', content: 'Write code' }],
    options: {
        temperature: 0.7,
        max_tokens: 2000
    }
})
```

## Type Definitions

### Request

The request uses TypeScript discriminated unions to enforce that either `assistant_id` OR `model` must be provided:

```typescript
// Base fields shared by both variants
interface ChatCompletionRequestBase {
    messages: ChatMessage[]         // Required: Chat messages
    chat_id?: string                // Optional: Chat ID (auto-generated if not provided)
    options?: ChatCompletionOptions // Optional: Advanced options
    metadata?: Record<string, any>  // Optional: Custom metadata
}

// Option 1: With assistant_id (recommended)
interface ChatCompletionRequestWithAssistant extends ChatCompletionRequestBase {
    assistant_id: string  // Required: Direct assistant reference
    model?: string        // Optional: For OpenAI compatibility
}

// Option 2: With model only (OpenAI compatibility)
interface ChatCompletionRequestWithModel extends ChatCompletionRequestBase {
    assistant_id?: string // Optional: Takes priority if provided
    model: string         // Required: Format *-yao_assistantID
}

// Union type - must be one or the other
type ChatCompletionRequest = 
    | ChatCompletionRequestWithAssistant 
    | ChatCompletionRequestWithModel
```

**Usage Examples:**

```typescript
// ✅ Valid: With assistant_id (recommended)
const request1: ChatCompletionRequest = {
    assistant_id: 'my-assistant',
    messages: [{ role: 'user', content: 'Hi' }]
}

// ✅ Valid: With model (OpenAI compatibility)
const request2: ChatCompletionRequest = {
    model: 'gpt-4o-yao_myassistant',
    messages: [{ role: 'user', content: 'Hi' }]
}

// ✅ Valid: Both provided (assistant_id takes priority)
const request3: ChatCompletionRequest = {
    assistant_id: 'my-assistant',
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hi' }]
}

// ❌ Invalid: Neither provided (TypeScript error)
const request4: ChatCompletionRequest = {
    messages: [{ role: 'user', content: 'Hi' }]
}
```

**Field Details:**

- **`assistant_id`** - Direct assistant reference (recommended):
  - Direct ID: `"my-assistant"`
  - Recommended for Yao applications
  - Takes priority if both fields are provided

- **`model`** - OpenAI compatibility mode:
  - Format: `[prefix-]modelName-yao_assistantID`
  - Backend extracts assistant_id (splits by `-yao_` and takes last part)
  - Examples:
    - `"gpt-4o-yao_myassistant"` → extracts `"myassistant"`
    - `"claude-3-sonnet-yao_chatbot"` → extracts `"chatbot"`
  - Use for OpenAI-compatible clients

**Parameter Resolution Priority** (backend):
  1. Query parameter `?assistant_id=xxx`
  2. Header `X-Yao-Assistant: xxx`
  3. Request body `assistant_id` field
  4. Extract from `model` field (part after `-yao_`)

```typescript
interface ChatCompletionOptions {
    temperature?: number
    max_tokens?: number
    max_completion_tokens?: number
    top_p?: number
    n?: number
    stream?: boolean
    stop?: string | string[]
    presence_penalty?: number
    frequency_penalty?: number
    logit_bias?: Record<string, number>
    user?: string
    seed?: number
    tools?: any[]
    tool_choice?: any
    response_format?: {
        type: 'text' | 'json_object' | 'json_schema'
        json_schema?: {
            name: string
            description?: string
            schema: any
            strict?: boolean
        }
    }
    audio?: {
        voice?: string
        format?: string
    }
    stream_options?: {
        include_usage?: boolean
    }
    metadata?: Record<string, any>
    route?: string
}
```

### ChatMessage (Request Input)

```typescript
// Message role in conversation
type MessageRole = 'developer' | 'system' | 'user' | 'assistant' | 'tool'

// Content part types for multimodal messages
type ContentPartType = 'text' | 'image_url' | 'input_audio' | 'file'

// Content part structures
interface ContentPart {
    type: ContentPartType
    text?: string                // For type="text"
    image_url?: {                // For type="image_url"
        url: string              // URL or uploader_id://file_id
        detail?: 'auto' | 'low' | 'high'
    }
    input_audio?: {              // For type="input_audio"
        data: string             // Wrapper format: uploader_id://file_id
        format: string           // Audio format (e.g., "wav", "mp3")
    }
    file?: {                     // For type="file" (backend support coming soon)
        url: string              // Wrapper format: uploader_id://file_id
        filename?: string
        mime_type?: string
    }
}

// Chat message in conversation
interface ChatMessage {
    role: MessageRole
    content?: string | ContentPart[]  // String or multimodal array
    name?: string                     // Optional participant name
    
    // Tool message specific
    tool_call_id?: string            // Required for tool messages
    
    // Assistant message specific
    tool_calls?: ToolCall[]          // Tool calls made by assistant
    refusal?: string                 // Refusal message
}

// Tool call structure
interface ToolCall {
    id: string
    type: 'function'
    function: {
        name: string
        arguments?: string           // JSON string
    }
}
```

**Usage Examples:**

```typescript
// Simple text message
const textMsg: ChatMessage = {
    role: 'user',
    content: 'Hello!'
}

// Multimodal message with image
const imageMsg: ChatMessage = {
    role: 'user',
    content: [
        { type: 'text', text: 'What is in this image?' },
        {
            type: 'image_url',
            image_url: {
                url: '__yao.attachment://abc123',  // File wrapper
                detail: 'high'
            }
        }
    ]
}

// Message with uploaded file
const fileMsg: ChatMessage = {
    role: 'user',
    content: [
        { type: 'text', text: 'Analyze this document' },
        {
            type: 'file',
            file: {
                url: '__yao.attachment://xyz789',
                filename: 'report.pdf',
                mime_type: 'application/pdf'
            }
        }
    ]
}
```

### Message (Universal DSL)

```typescript
interface Message {
    // Core fields
    type: string                    // Message type (built-in or custom)
    props?: Record<string, any>     // Type-specific properties

    // Streaming control
    id?: string                     // Message ID for merging
    delta?: boolean                 // Incremental update flag
    done?: boolean                  // Completion flag

    // Delta update control
    delta_path?: string             // Update path (e.g., "content", "rows")
    delta_action?: 'append' | 'replace' | 'merge' | 'set'

    // Type correction
    type_change?: boolean           // Type correction flag

    // Message grouping
    group_id?: string               // Group ID
    group_start?: boolean           // Group start marker
    group_end?: boolean             // Group end marker

    // Metadata
    metadata?: {
        timestamp?: number          // Unix nanoseconds
        sequence?: number           // Sequence number
        trace_id?: string           // Trace ID for debugging
    }
}
```

### Built-in Props Types

```typescript
interface TextProps {
    content: string                 // Supports Markdown
}

interface ThinkingProps {
    content: string                 // Reasoning content
}

interface LoadingProps {
    message: string                 // Loading message
}

interface ToolCallProps {
    id: string
    name: string
    arguments?: string              // JSON string
}

interface ErrorProps {
    message: string
    code?: string
    details?: string
}

interface ImageProps {
    url: string                     // Required
    alt?: string
    width?: number
    height?: number
    detail?: 'auto' | 'low' | 'high'
}

interface AudioProps {
    url: string                     // Required
    format?: string                 // "mp3", "wav", "ogg"
    duration?: number
    transcript?: string
    autoplay?: boolean
    controls?: boolean              // Default: true
}

interface VideoProps {
    url: string                     // Required
    format?: string                 // "mp4", "webm"
    duration?: number
    thumbnail?: string
    width?: number
    height?: number
    autoplay?: boolean
    controls?: boolean              // Default: true
    loop?: boolean
}

interface ActionProps {
    name: string                    // Action name (e.g., "open_panel")
    payload?: Record<string, any>   // Action parameters
}

interface EventProps {
    event: string                   // Event type (e.g., "stream_start")
    message?: string                // Human-readable message
    data?: Record<string, any>      // Event data
}
```

## Advanced Usage

### Type Guards

```typescript
import { 
    IsBuiltinMessage,
    IsTextMessage,
    IsErrorMessage 
} from '@yao/cui/openapi'

// Check if built-in type
if (IsBuiltinMessage(msg)) {
    // msg is one of the 10 built-in types
}

// Specific type checking with type narrowing
if (IsTextMessage(msg)) {
    // TypeScript knows msg.props is TextProps
    console.log(msg.props.content)
}

if (IsErrorMessage(msg)) {
    // TypeScript knows msg.props is ErrorProps
    console.error(msg.props.message, msg.props.code)
}
```

### Custom Message Types

Define your own message types:

```typescript
// Define custom props type
interface ShoppingCartProps {
    items: Array<{
        id: string
        name: string
        price: number
        quantity: number
    }>
    total: number
    currency: string
}

// Create custom message
const cartMessage: Message = {
    type: 'shopping_cart',
    props: {
        items: [
            { id: '1', name: 'Item A', price: 29.99, quantity: 2 },
            { id: '2', name: 'Item B', price: 49.99, quantity: 1 }
        ],
        total: 109.97,
        currency: 'USD'
    }
}

// Type guard for custom type
function IsShoppingCartMessage(msg: Message): msg is Message & { props: ShoppingCartProps } {
    return msg.type === 'shopping_cart'
}

// Usage
if (IsShoppingCartMessage(msg)) {
    // TypeScript knows msg.props is ShoppingCartProps
    renderShoppingCart(msg.props)
}
```

### Error Handling

```typescript
const abort = chat.StreamCompletion(
    {
        assistant_id: 'my-assistant',
        messages: [...]
    },
    (chunk) => {
        // Check for errors in event messages
        if (IsEventMessage(chunk) && chunk.props.event === 'stream_end') {
            const data = chunk.props.data
            if (data?.status === 'error') {
                console.error('Stream error:', data.error)
            }
        }
    },
    (error) => {
        // Network or parsing errors
        console.error('Connection error:', error)
    }
)

// Cancel stream
setTimeout(() => {
    abort() // Gracefully abort the stream
}, 5000)
```

## Browser Compatibility

This implementation uses modern browser APIs:
- `fetch()` - For HTTP requests
- `ReadableStream` - For streaming responses
- `TextDecoder` - For decoding bytes
- `AbortController` - For cancellation

All major browsers support these APIs. No Node.js required.

## Backend Configuration

The Chat API automatically sets the `X-Yao-Accept: cui-web` header, which tells the backend to:
- Use CUI output format (universal message DSL)
- Send messages directly without OpenAI conversion
- Support all built-in and custom message types

## See Also

- [Trace API](../trace/README.md) - Debugging and tracing
- [Agent API](../agent/README.md) - Assistant management
- Backend: `yao/agent/output/README.md` - Output module documentation
- Backend: `yao/agent/output/BUILTIN_TYPES.md` - Built-in types reference

