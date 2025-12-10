# Chat API

OpenAPI client for Yao Chat Completions with streaming support.

## Features

- ✅ **Streaming Support**: Real-time SSE (Server-Sent Events) over POST requests
- ✅ **Type Safety**: Full TypeScript type definitions with discriminated unions
- ✅ **Built-in Message Types**: 11 standardized message types with defined Props
- ✅ **Extensible**: Support for custom message types
- ✅ **Browser Native**: Uses fetch() and ReadableStream APIs (no Node.js required)
- ✅ **Cancellable**: Built-in AbortController support
- ✅ **Chat History**: Full session management with time-based grouping
- ✅ **Permission Control**: Integrated with Yao's unified permission system

## API Methods Summary

The `Chat` class provides the following methods:

### Chat Completion

| Method | Description |
|--------|-------------|
| `StreamCompletion(request, onEvent, onError?)` | Stream chat completion (SSE via POST). Returns abort function. |
| `AppendMessages(contextId, messages, type?, metadata?)` | Append messages to running completion (pre-input/interrupt support). |

### Chat Session Management

| Method | Description |
|--------|-------------|
| `ListSessions(filter?)` | List chat sessions with pagination, filtering, and time-based grouping. |
| `GetSession(chatId)` | Get a single chat session by ID. |
| `UpdateSession(chatId, updates)` | Update chat session (title, status, metadata). |
| `DeleteSession(chatId)` | Delete a chat session (soft delete). |
| `GetMessages(chatId, filter?)` | Get messages for a chat session with filtering. |

## Quick Start

### Basic Streaming

```typescript
import { OpenAPI, Chat } from '@yao/cui/openapi'

// Initialize
const api = new OpenAPI({ baseURL: '/v1' })
const chat = new Chat(api)

// Stream chat completion
const abort = chat.StreamCompletion(
    {
        assistant_id: 'my-assistant',
        messages: [
            { role: 'user', content: 'Hello!' }
        ]
    },
    (chunk) => {
        // Handle each chunk (Message object)
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

### Append Messages (Pre-input Support)

The `AppendMessages` API allows users to send new messages while the AI is still generating a response. This is useful for implementing "type-ahead" or interrupt functionality where users can add follow-up questions without waiting for the current response to complete.

```typescript
import { OpenAPI, Chat } from '@yao/cui/openapi'

const api = new OpenAPI({ baseURL: '/v1' })
const chat = new Chat(api)

// Step 1: Start streaming and capture context_id
let contextId: string

const abort = chat.StreamCompletion(
    {
        assistant_id: 'my-assistant',
        messages: [
            { role: 'user', content: 'Explain quantum computing in detail' }
        ]
    },
    (chunk) => {
        // Capture context_id from stream_start event
        if (chunk.type === 'event' && chunk.props?.event === 'stream_start') {
            contextId = chunk.props.data.context_id
            console.log('Context ID:', contextId)
        }
        
        // Handle other chunks
        console.log(chunk)
    }
)

// Step 2: User sends a new message while AI is still responding
// This will append the new message to the conversation
setTimeout(async () => {
    try {
        const response = await chat.AppendMessages(
            contextId,
            [
                { role: 'user', content: 'Wait, can you also explain quantum entanglement?' }
            ],
            'graceful' // or 'force'
        )
        
        console.log('Message appended:', response)
    } catch (error) {
        console.error('Failed to append message:', error)
    }
}, 2000) // Append after 2 seconds
```

**Interrupt Types:**

- **`graceful`** (default): Waits for the current step to complete before handling the interrupt
  - Best for most scenarios
  - Allows the AI to finish its current thought before processing new input
  - Example: User adds a follow-up question

- **`force`**: Immediately cancels the current operation and processes the interrupt
  - Use when immediate interruption is needed
  - Stops LLM streaming and other operations immediately
  - Example: User realizes the question was wrong and wants to stop

### Stop Streaming (Cancel Without Appending)

To cancel a streaming response without adding new messages (e.g., user clicks a "Stop" button), simply call the `abort()` function returned by `StreamCompletion()`:

```typescript
import { OpenAPI, Chat } from '@yao/cui/openapi'

const api = new OpenAPI({ baseURL: '/v1' })
const chat = new Chat(api)

// Start streaming - StreamCompletion returns an abort function
const abort = chat.StreamCompletion(
    {
        assistant_id: 'my-assistant',
        messages: [
            { role: 'user', content: 'Write a very long essay about history' }
        ]
    },
    (chunk) => {
        console.log(chunk)
    }
)

// User clicks "Stop" button - call the abort function
function handleStopButton() {
    abort() // This cancels both frontend reading AND backend processing
}

// Bind to stop button
document.getElementById('stop-btn')?.addEventListener('click', handleStopButton)
```

**What Happens When You Call `abort()`:**

The `abort()` function automatically handles proper cancellation:

1. **Captures `context_id`**: Internally captures the `context_id` from the `stream_start` event
2. **Sends cancellation signal**: Calls `AppendMessages(contextId, [], 'force')` to tell the backend to stop
3. **Stops frontend reading**: Also calls `AbortController.abort()` to stop reading the stream

This is equivalent to manually doing:

```typescript
// Manual approach (NOT recommended - use abort() instead)
let contextId: string

const abort = chat.StreamCompletion(
    { ... },
    (chunk) => {
        // Manually capture context_id
        if (chunk.type === 'event' && chunk.props?.event === 'stream_start') {
            contextId = chunk.props.data?.context_id
        }
    }
)

function manualStop() {
    // Manually send force interrupt
    if (contextId) {
        chat.AppendMessages(contextId, [], 'force')
    }
}
```

**Why Use `AppendMessages` Instead of Just Calling `abort()`?**

If you only rely on the browser's native `fetch` API with `AbortController`, there's a fundamental limitation with SSE (Server-Sent Events):

**Browser `fetch` API Limitation:**
- When you call `abort()` on an ongoing `fetch` request with `ReadableStream`, the browser only **stops reading the response**
- The HTTP connection may remain open, and **the backend does not receive a cancellation signal**
- The backend LLM continues generating the response, wasting compute resources

**Solution: Use `AppendMessages` for Proper Cancellation**

`StreamCompletion()` is already designed to handle this correctly. It automatically:
1. Captures the `context_id` from the `stream_start` event
2. When you call the returned `abort()` function, it:
   - Sends `AppendMessages(contextId, [], 'force')` to the backend
   - Also calls `AbortController.abort()` to stop frontend reading

**Benefits:**
- ✅ **Backend receives signal**: Server immediately cancels LLM processing
- ✅ **Saves resources**: No wasted computation on unwanted responses
- ✅ **Proper cleanup**: Backend context is properly cancelled and cleaned up
- ✅ **Standard pattern**: This is the correct way to cancel SSE streams in browsers

**Note:** If you're implementing your own fetch-based SSE client, you should follow the same pattern: send an explicit cancellation API call (like `AppendMessages`) instead of relying solely on `AbortController`.

**How It Works:**

1. **Frontend**: Sends `POST /chat/completions/:context_id/append` with `type: 'force'` and `messages: []`
2. **Backend**: Receives the force interrupt signal with no messages
3. **Cancellation**: Backend immediately cancels the streaming context
4. **LLM**: Streaming stops and returns with cancellation status

**Key Points:**

- **Empty messages**: `messages: []` indicates pure cancellation without appending
- **Force type required**: Must use `'force'` interrupt type for cancellation
- **Context ID needed**: Must capture `context_id` from the `stream_start` event
- **Immediate effect**: Streaming stops immediately, LLM receives cancellation signal
- **Best practice**: Always handle the promise rejection in case the context is already completed

**Complete Example with Stop Button:**

```typescript
import { OpenAPI, Chat } from '@yao/cui/openapi'

const api = new OpenAPI({ baseURL: '/v1' })
const chat = new Chat(api)

let contextId: string | null = null
let isStreaming = false

function startChat() {
    isStreaming = true
    contextId = null
    
    chat.StreamCompletion(
        {
            assistant_id: 'my-assistant',
            messages: [
                { role: 'user', content: 'Explain artificial intelligence in detail' }
            ]
        },
        (chunk) => {
            // Capture context_id from stream_start
            if (chunk.type === 'event' && chunk.props?.event === 'stream_start') {
                contextId = chunk.props.data?.context_id || null
                updateStopButton(true) // Enable stop button
            }
            
            // Handle stream_end
            if (chunk.type === 'event' && chunk.props?.event === 'stream_end') {
                isStreaming = false
                updateStopButton(false) // Disable stop button
            }
            
            // Display message
            displayMessage(chunk)
        },
        (error) => {
            console.error('Stream error:', error)
            isStreaming = false
            updateStopButton(false)
        }
    )
}

function stopStreaming() {
    if (!contextId || !isStreaming) return
    
    chat.AppendMessages(contextId, [], 'force')
        .then(() => {
            console.log('Stream stopped successfully')
            isStreaming = false
            updateStopButton(false)
        })
        .catch((error) => {
            console.error('Failed to stop stream:', error)
        })
}

function updateStopButton(enabled: boolean) {
    const stopBtn = document.getElementById('stop-btn') as HTMLButtonElement
    if (stopBtn) {
        stopBtn.disabled = !enabled
    }
}

// Event handlers
document.getElementById('send-btn')?.addEventListener('click', startChat)
document.getElementById('stop-btn')?.addEventListener('click', stopStreaming)
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
chat.StreamCompletion(
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
// Note: Backend manages history, frontend only sends current user input
chat.StreamCompletion(
    {
        assistant_id: 'my-assistant',
        chat_id: chatId,  // Same ID for continuation
        messages: [
            { role: 'user', content: 'Tell me a joke' }  // Only send new user input
        ]
    },
    (chunk) => { /* ... */ }
)

// Option 2: Let backend auto-detect (omit chat_id)
// Note: This triggers hash computation on backend - use only for stateless clients
chat.StreamCompletion(
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
chat.StreamCompletion(
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

### Skip Configuration (History & Trace)

For utility operations like title generation or prompt suggestions, you can skip saving chat history and/or trace logs. This is useful when calling agents for non-conversational purposes.

```typescript
// Example: Generate a title for an existing chat (tool usage)
chat.StreamCompletion(
    {
        assistant_id: 'workers.system.title',
        messages: [
            { role: 'user', content: 'Generate a title for: Hello, how are you?' }
        ],
        skip: {
            history: true,  // Don't save to chat history (this is a tool call, not a conversation)
            trace: false    // Still log trace for debugging
        }
    },
    (chunk) => {
        if (IsTextMessage(chunk)) {
            console.log('Generated title:', chunk.props.content)
        }
    }
)

// Example: Generate prompt suggestions (tool usage)
chat.StreamCompletion(
    {
        assistant_id: 'workers.system.prompt',
        messages: [
            { role: 'user', content: 'Generate prompts for a coding assistant' }
        ],
        skip: {
            history: true,  // Don't save this tool call to history
            trace: true     // Also skip trace for performance
        }
    },
    (chunk) => { /* ... */ }
)
```

**Skip Configuration (via Request Body):**

The `skip` parameter is sent via request body and is **completely optional**:

```typescript
interface Skip {
    history?: boolean  // Optional: Skip saving chat history
    trace?: boolean    // Optional: Skip trace logging
}

// In request
{
    skip?: Skip  // Optional: If omitted, uses default behavior
}
```

**Default Behavior (when `skip` is not provided):**
- ✅ Chat history **WILL BE SAVED** to database (normal conversation mode)
- ✅ Trace logs **WILL BE GENERATED** to show agent's working process to users

**Parameters:**

- **`skip.history`** (boolean, optional, default: `false`)
  - `true`: Skip saving chat history to database
  - `false` or omitted: Save chat history (default behavior)
  - Use `true` for: Agents called as tools (title generation, prompt suggestions, vision analysis, etc.)
  - These are utility calls, not actual conversations
  - Saves storage space and keeps chat history clean
  
- **`skip.trace`** (boolean, optional, default: `false`)
  - `true`: Skip trace logging
  - `false` or omitted: Generate trace logs (default behavior)
  - **What is trace**: Visual representation of agent's working process (tool calls, reasoning steps, data flow) shown to users
  - Use `true` for: High-frequency tool calls where users don't need to see the working process
  - Reduces logging overhead and simplifies user experience for utility operations

**Examples:**

```typescript
// Default: Save history and trace (normal conversation)
chat.StreamCompletion({
    assistant_id: 'my-assistant',
    messages: [{ role: 'user', content: 'Hello' }]
    // No skip parameter - saves history and trace
})

// Skip only history (tool call, but keep trace to show working process)
chat.StreamCompletion({
    assistant_id: 'workers.system.title',
    messages: [{ role: 'user', content: 'Generate title' }],
    skip: {
        history: true   // Skip history
        // trace is omitted - defaults to false (will show agent's working process to user)
    }
})

// Skip both history and trace (simple utility call, no need to show working process)
chat.StreamCompletion({
    assistant_id: 'workers.system.prompt',
    messages: [{ role: 'user', content: 'Generate prompts' }],
    skip: {
        history: true,  // Skip history
        trace: true     // Skip trace (users don't need to see the working process)
    }
})
```

**When to Use Skip:**

| Scenario | `skip.history` | `skip.trace` | Reason |
|----------|----------------|--------------|--------|
| **User conversation** | ❌ `false` | ❌ `false` | Save everything, show agent's working process |
| **Title generation** | ✅ `true` | ⚠️ Optional | Don't save utility call; trace optional depending on if users want to see how title is generated |
| **Prompt suggestions** | ✅ `true` | ✅ `true` | Simple utility; users don't need to see working process |
| **Vision thumbnail** | ✅ `true` | ✅ `true` | Background processing; no need to show trace |
| **Search queries** | ✅ `true` | ⚠️ Optional | Don't save search calls; trace optional if users want to see search process |
| **Complex analysis** | ✅ `true` | ❌ `false` | Tool call but keep trace to show working process to users |

**Guidelines:**
- ✅ `skip.history = true`: Any agent used as a tool (not part of conversation)
- ✅ `skip.trace = true`: When users don't need to see the agent's working process (simple utilities)
- ❌ `skip.trace = false`: When users want to understand how the agent works (complex operations, transparency)

**Key Point**: Use `skip` when calling agents **as tools** for utility purposes, not when they're part of the user's conversation flow. Trace is for showing users how the agent works, not just for debugging.

### Multimodal Messages (Vision, Audio)

Send images and audio along with text using multimodal content:

```typescript
// Vision: Analyze an image
chat.StreamCompletion(
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
chat.StreamCompletion(
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
chat.StreamCompletion(
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
chat.StreamCompletion(
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
chat.StreamCompletion(
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
        chat.StreamCompletion(
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

        chat.StreamCompletion(
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

        chat.StreamCompletion(
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
chat.StreamCompletion(
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
- `chat_id`: Links messages in the same conversation for context continuity
  - **Recommended**: Generate on frontend (any unique string with 8+ characters)
    - Best performance - avoids backend hash computation
    - Examples: nanoid, UUID, timestamp-based ID
  - **Fallback**: Backend auto-detection (omit `chat_id`)
    - Matches previous messages (excluding assistant responses) via SHA256 hash
    - Same message history → Same `chat_id` (conversation continuation)
    - New message history → New `chat_id` (new conversation)
    - Use only for stateless clients without ID management capability
- `locale`: User locale for i18n support (e.g., `'zh-CN'`, `'en-US'`)
  - Used for localizing assistant responses and error messages
  - **Priority**: Query parameter > `Accept-Language` header > `metadata.locale`
  - Frontend SDK sends via query parameter `?locale=xxx`
- `options`: OpenAI-compatible parameters (temperature, max_tokens, etc.)
- `metadata`: Custom metadata object
- `skip`: Skip configuration for tool calls (sent via request body)
  - `skip.history`: Skip saving chat history (use when calling agents as tools)
  - `skip.trace`: Skip trace logging (reduces overhead for utility calls)

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

All delta chunks for the same logical message share the same `message_id`. The frontend merges these chunks by `message_id` to build the complete message.

> **⚠️ Important**: Backend may reuse `message_id` values across different streams (e.g., M1, M2, M3 in each new conversation). To prevent conflicts, use a **stream-level namespace** to make `message_id` unique across conversations. See implementation details below.

```typescript
import { Message } from '@yao/cui/openapi'
import { nanoid } from 'nanoid'

// Message cache for merging deltas (keyed by namespaced message_id)
const messageCache = new Map<string, any>()

// Stream ID for namespacing message_id (prevents conflicts across different streams)
let currentStreamId: string = ''

function applyDelta(messageId: string, chunk: Message): any {
    // Get or initialize message state for this message_id
    let current = messageCache.get(messageId)
    if (!current) {
        current = { type: chunk.type, props: {} }
        messageCache.set(messageId, current)
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

// Usage with stream-level namespacing
chat.StreamCompletion(
    {
        assistant_id: 'my-assistant',
        messages: [{ role: 'user', content: 'Tell me a story' }]
    },
    (chunk) => {
        // Generate unique stream ID on stream_start to namespace message_id
        if (IsEventMessage(chunk) && chunk.props?.event === 'stream_start') {
            currentStreamId = nanoid() // Generate unique ID for this stream
            console.log('New stream started:', currentStreamId)
            return
        }
        
        // Handle message_end event to clean up cache
        if (IsEventMessage(chunk) && chunk.props?.event === 'message_end') {
            const rawMessageId = chunk.props.data?.message_id
            if (rawMessageId) {
                // Use namespaced message_id for cleanup
                const namespacedId = `${currentStreamId}:${rawMessageId}`
                messageCache.delete(namespacedId)
            }
            return
        }
        
        // Use namespaced message_id to merge delta chunks
        // This prevents M1 from stream 1 conflicting with M1 from stream 2
        if (chunk.message_id) {
            const namespacedId = `${currentStreamId}:${chunk.message_id}`
            const merged = applyDelta(namespacedId, chunk)
            
            // Update UI with merged state (use namespaced ID as key)
            updateMessageUI(namespacedId, merged)
        }
    }
)
```

**Delta Action Examples:**

```typescript
// Append: Streaming text content (most common)
{ message_id: "M1", delta: true, delta_action: "append", props: { content: "Hello" } }
{ message_id: "M1", delta: true, delta_action: "append", props: { content: " world" } }
// Result: { content: "Hello world" }

// Replace: Update entire field
{ message_id: "M2", delta: true, delta_action: "replace", delta_path: "status", props: { status: "processing" } }
{ message_id: "M2", delta: true, delta_action: "replace", delta_path: "status", props: { status: "completed" } }
// Result: { status: "completed" }

// Merge: Combine objects
{ message_id: "M3", delta: true, delta_action: "merge", props: { metadata: { step: 1 } } }
{ message_id: "M3", delta: true, delta_action: "merge", props: { metadata: { progress: 50 } } }
// Result: { metadata: { step: 1, progress: 50 } }

// Set: Add new fields
{ message_id: "M4", delta: true, delta_action: "set", delta_path: "items.0.name", props: { items: [{ name: "Item 1" }] } }
{ message_id: "M4", delta: true, delta_action: "set", delta_path: "items.1.name", props: { items: [null, { name: "Item 2" }] } }
// Result: { items: [{ name: "Item 1" }, { name: "Item 2" }] }
```

### Best Practices for Frontend Implementation

#### 1. Stream-Level Message ID Namespacing

**Problem**: Backend reuses `message_id` values (M1, M2, M3...) across different streams, causing conflicts when rendering multiple conversations.

**Solution**: Generate a unique `streamId` on each `stream_start` event and use it to namespace `message_id`:

```typescript
import { nanoid } from 'nanoid'

// Track current stream ID
const streamIdRef = useRef<Record<string, string>>({}) // chatId -> streamId

// On stream_start: Generate new stream ID
if (chunk.props?.event === 'stream_start') {
    const streamId = nanoid()
    streamIdRef.current[chatId] = streamId
}

// When processing messages: Namespace message_id
const streamId = streamIdRef.current[chatId] || 'default'
const namespacedMessageId = `${streamId}:${chunk.message_id}` // e.g., "abc123:M1"

// Use namespacedMessageId for:
// - Delta cache keys
// - Message state management
// - Completed message tracking
```

#### 2. React Key Generation for Message Lists

**Problem**: Using `message_id` as React key causes rendering conflicts when backend reuses IDs across streams.

**Solution**: Add a frontend-only `ui_id` field for React keys:

```typescript
// Add ui_id to Message type
interface BaseMessage {
    // ... other fields
    ui_id?: string  // Frontend-only unique ID for React key
}

// Generate ui_id when creating new messages
const newMessage: Message = {
    ui_id: nanoid(),           // ← Unique UI ID for React
    message_id: namespacedMessageId,  // ← Namespaced for delta merging
    chunk_id: chunk.chunk_id,
    type: chunk.type,
    props: mergedState.props,
    delta: chunk.delta
}

// In React component: Use ui_id as key
{messages.map((msg) => (
    <MessageItem 
        key={msg.ui_id || msg.message_id || msg.chunk_id}  // Prefer ui_id
        message={msg} 
    />
))}
```

**Why This Matters:**
- `message_id`: For delta merging logic (backend's logical message ID)
- `ui_id`: For React rendering (frontend's unique UI element ID)
- Separation prevents key conflicts and ensures correct message ordering

#### 3. Tracking Completed Messages

**Problem**: After `message_end` event, delayed delta chunks may re-enable the streaming cursor.

**Solution**: Track completed messages and force `delta: false` for late chunks:

```typescript
// Track completed messages
const completedMessagesRef = useRef<Record<string, boolean>>({})

// On stream_start: Clear completed tracking
if (chunk.props?.event === 'stream_start') {
    completedMessagesRef.current = {}
}

// On message_end: Mark as completed
if (chunk.props?.event === 'message_end') {
    const rawMessageId = chunk.props.data?.message_id
    if (rawMessageId) {
        const namespacedId = `${streamId}:${rawMessageId}`
        completedMessagesRef.current[namespacedId] = true
    }
}

// When processing deltas: Check if completed
const isCompleted = completedMessagesRef.current[namespacedMessageId]
const updatedMessage: Message = {
    // ... other fields
    delta: isCompleted ? false : chunk.delta  // Force false if completed
}
```

#### 4. Complete Implementation Example

```typescript
import { nanoid } from 'nanoid'
import { Message, IsEventMessage } from '@yao/cui/openapi'

function useChat() {
    const [messages, setMessages] = useState<Message[]>([])
    const streamIdRef = useRef<string>('')
    const completedMessagesRef = useRef<Record<string, boolean>>({})
    
    const handleChunk = (chunk: Message) => {
        if (IsEventMessage(chunk)) {
            // Stream start: Initialize new stream
            if (chunk.props?.event === 'stream_start') {
                streamIdRef.current = nanoid()
                completedMessagesRef.current = {}
                return
            }
            
            // Message end: Mark completed
            if (chunk.props?.event === 'message_end') {
                const rawMessageId = chunk.props.data?.message_id
                if (rawMessageId) {
                    const streamId = streamIdRef.current || 'default'
                    const namespacedId = `${streamId}:${rawMessageId}`
                    completedMessagesRef.current[namespacedId] = true
                    
                    // Update UI to remove streaming indicator
                    setMessages(prev => prev.map(m => 
                        m.message_id === namespacedId 
                            ? { ...m, delta: false }
                            : m
                    ))
                }
                return
            }
        }
        
        // Process message chunks
        if (chunk.message_id) {
            const streamId = streamIdRef.current || 'default'
            const namespacedId = `${streamId}:${chunk.message_id}`
            const isCompleted = completedMessagesRef.current[namespacedId]
            
            // Apply delta merging
            const mergedState = applyDelta(namespacedId, chunk)
            
            // Update or create message
            setMessages(prev => {
                const index = prev.findIndex(m => m.message_id === namespacedId)
                
                if (index !== -1) {
                    // Update existing: Preserve ui_id
                    const updated = [...prev]
                    updated[index] = {
                        ...updated[index],
                        message_id: namespacedId,
                        type: mergedState.type,
                        props: mergedState.props,
                        delta: isCompleted ? false : chunk.delta
                    }
                    return updated
                } else {
                    // Create new: Generate ui_id
                    const newMessage: Message = {
                        ui_id: nanoid(),  // ← Unique for React key
                        message_id: namespacedId,
                        chunk_id: chunk.chunk_id,
                        block_id: chunk.block_id,
                        thread_id: chunk.thread_id,
                        type: mergedState.type,
                        props: mergedState.props,
                        delta: isCompleted ? false : chunk.delta
                    }
                    return [...prev, newMessage]
                }
            })
        }
    }
    
    return { messages, handleChunk }
}

// In React component
function MessageList({ messages }: { messages: Message[] }) {
    return (
        <div>
            {messages.map((msg) => (
                <MessageItem 
                    key={msg.ui_id || msg.message_id || msg.chunk_id}
                    message={msg}
                />
            ))}
        </div>
    )
}
```

**Key Takeaways:**

1. ✅ **Namespace `message_id`** with stream-level ID to prevent cross-stream conflicts
2. ✅ **Add `ui_id` field** for React keys to ensure stable rendering
3. ✅ **Track completed messages** to prevent late deltas from re-enabling streaming cursor
4. ✅ **Clear state on `stream_start`** to avoid pollution from previous streams
5. ✅ **Preserve `ui_id` on updates** to maintain React key stability

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

// Message state cache for delta merging (keyed by message_id)
const messageStates = new Map<string, any>()

function renderMessage(msg: Message, mergedProps: any): HTMLElement {
    // User input message - render as user bubble
    if (IsUserInputMessage(msg)) {
        const div = document.createElement('div')
        div.className = 'message-user'
        
        // Handle multimodal content
        let contentHTML = ''
        if (typeof mergedProps.content === 'string') {
            contentHTML = mergedProps.content
        } else {
            // Render multimodal parts (text, images, etc.)
            contentHTML = renderMultimodalContent(mergedProps.content)
        }
        
        div.innerHTML = `
            <div class="user-bubble">${contentHTML}</div>
        `
        return div
    }
    
    // Text message - render as markdown (AI response)
    if (IsTextMessage(msg)) {
        const div = document.createElement('div')
        div.className = 'message-text'
        div.innerHTML = marked(mergedProps.content || '') // Use markdown parser
        
        // Add streaming indicator for delta messages
        if (msg.delta) {
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
        if (msg.delta) {
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
        if (msg.delta) {
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

function applyDelta(messageId: string, msg: Message): any {
    let state = messageStates.get(messageId)
    
    if (!msg.delta) {
        // Not a delta, use props directly
        state = { ...msg.props }
        messageStates.set(messageId, state)
        return state
    }
    
    // Initialize state if first delta
    if (!state) {
        state = {}
        messageStates.set(messageId, state)
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
chat.StreamCompletion(
    {
        assistant_id: 'my-assistant',
        messages: [{ role: 'user', content: 'Explain quantum computing' }]
    },
    (chunk) => {
        const container = document.getElementById('messages')
        if (!container) return
        
        // Handle message_end event - clean up state cache
        if (IsEventMessage(chunk) && chunk.props?.event === 'message_end') {
            const messageId = chunk.props.data?.message_id
            if (messageId) {
                // Clean up state cache
                messageStates.delete(messageId)
                
                // Remove streaming indicator and mark as complete
                const element = document.getElementById(`msg-${messageId}`)
                if (element) {
                    element.classList.remove('streaming')
                    element.classList.add('complete')
                }
            }
            return
        }
        
        // Skip other event messages
        if (chunk.type === 'event') return
        
        // Use message_id for merging delta chunks
        // All delta chunks for the same logical message share one message_id
        const messageId = chunk.message_id || `msg-${Date.now()}`
        
        // Handle type change: backend corrected the message type
        if (chunk.type_change) {
            // In streaming, backend may not know final type until enough data is received
            // Examples: loading → text, text → image, loading → error
            // Clear old state and re-render with correct component type
            messageStates.delete(messageId)
            const element = renderMessage(chunk, chunk.props || {})
            element.id = `msg-${messageId}`
            
            const existing = document.getElementById(`msg-${messageId}`)
            if (existing) {
                // Replace with new component type
                existing.replaceWith(element)
            } else {
                container.appendChild(element)
            }
            
            // Store new state for future deltas
            if (chunk.props) {
                messageStates.set(messageId, { ...chunk.props })
            }
            return
        }
        
        // Normal delta handling - merge by message_id
        const mergedProps = applyDelta(messageId, chunk)
        
        // Render with merged state
        const element = renderMessage(chunk, mergedProps)
        element.id = `msg-${messageId}`
        
        // Update or append element
        const existing = document.getElementById(`msg-${messageId}`)
        if (existing) {
            existing.replaceWith(element)
        } else {
            container.appendChild(element)
        }
    }
)
```

**Key Points for Delta Rendering:**

1. **State Management**: Use `messageStates` Map to cache merged props for each `message_id` (all delta chunks for same message share one `message_id`)
2. **Delta Merging**: Call `applyDelta(messageId, chunk)` to merge incremental updates before rendering
3. **Type Change Handling**: When `type_change: true`, clear old state and re-render with new component type
   - **Why type changes occur**: In streaming, the backend may not know the final message type until enough data is received or processing is complete
   - **Common scenarios**:
     - `loading` → `text`: Started with loading indicator, now determined it's text output
     - `loading` → `image`: Processing complete, result is an image
     - `loading` → `error`: Processing failed during execution
     - `text` → `image`: Initially thought it's text, but generated an image
     - `text` → `video`: Content generation resulted in a video
   - **How to handle**: Clear old component state, replace with new component type's renderer
4. **Visual Feedback**: Add `.streaming` class during delta updates, `.complete` when `message_end` event received
5. **Content Types**: Handle both simple text streaming and complex structured updates
6. **Cleanup**: Remove state from cache when `message_end` event is received (event data contains `message_id`)

## Message Types

The Chat API uses a universal message DSL that supports 11 built-in types and unlimited custom types.

### Built-in Types

| Type | Constant | Props | Description |
|------|----------|-------|-------------|
| `user_input` | `MessageType.USER_INPUT` | `UserInputProps` | User input message (frontend display) |
| `text` | `MessageType.TEXT` | `TextProps` | Text or Markdown content (AI responses) |
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

Event messages (`type: 'event'`) use standardized event constants in their `props.event` field. Each event type has its own structured data format.

**Hierarchical Structure:** Stream > Thread > Block > Message > Chunk

| Level | Event | Constant | Data Type | Description |
|-------|-------|----------|-----------|-------------|
| **Stream** | `stream_start` | `EventType.STREAM_START` | `StreamStartData` | Overall conversation stream starts |
| **Stream** | `stream_end` | `EventType.STREAM_END` | `StreamEndData` | Overall conversation stream ends |
| **Thread** | `thread_start` | `EventType.THREAD_START` | `ThreadStartData` | Concurrent operation thread starts |
| **Thread** | `thread_end` | `EventType.THREAD_END` | `ThreadEndData` | Concurrent operation thread ends |
| **Block** | `block_start` | `EventType.BLOCK_START` | `BlockStartData` | Output block/section starts |
| **Block** | `block_end` | `EventType.BLOCK_END` | `BlockEndData` | Output block/section ends |
| **Message** | `message_start` | `EventType.MESSAGE_START` | `MessageStartData` | Single logical message starts |
| **Message** | `message_end` | `EventType.MESSAGE_END` | `MessageEndData` | Single logical message ends |

**Event Data Structures:**

```typescript
import { 
    EventType, 
    EventMessage, 
    StreamStartData,
    StreamEndData,
    ThreadStartData,
    ThreadEndData,
    BlockStartData,
    BlockEndData,
    MessageStartData,
    MessageEndData,
    IsStreamStartEvent,
    IsStreamEndEvent,
    IsThreadStartEvent,
    IsThreadEndEvent,
    IsBlockStartEvent,
    IsBlockEndEvent,
    IsMessageStartEvent,
    IsMessageEndEvent
} from '@yao/cui/openapi'

// Stream start event (overall conversation stream begins)
const streamStartEvent: EventMessage = {
    type: MessageType.EVENT,
    props: {
        event: EventType.STREAM_START,
        message: 'Stream started',
        data: {
            context_id: 'ctx-abc123',
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

// Stream end event (overall conversation stream completes)
const streamEndEvent: EventMessage = {
    type: MessageType.EVENT,
    props: {
        event: EventType.STREAM_END,
        data: {
            request_id: 'req-123',
            context_id: 'ctx-abc123',
            trace_id: 'trace-789',
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

// Thread start event (concurrent operation begins)
const threadStartEvent: EventMessage = {
    type: MessageType.EVENT,
    props: {
        event: EventType.THREAD_START,
        message: 'Thread started',
        data: {
            thread_id: 'T1',
            type: 'mcp',
            timestamp: 1234567890,
            label: 'Parallel search 1'
        }
    }
}

// Thread end event (concurrent operation completes)
const threadEndEvent: EventMessage = {
    type: MessageType.EVENT,
    props: {
        event: EventType.THREAD_END,
        message: 'Thread completed',
        data: {
            thread_id: 'T1',
            type: 'mcp',
            timestamp: 1234567893,
            duration_ms: 3000,
            block_count: 1,
            status: 'completed'
        }
    }
}

// Block start event (output block/section begins)
const blockStartEvent: EventMessage = {
    type: MessageType.EVENT,
    props: {
        event: EventType.BLOCK_START,
        message: 'Block started',
        data: {
            block_id: 'B1',
            type: 'llm',
            timestamp: 1234567890,
            label: 'Analyzing image'
        }
    }
}

// Block end event (output block/section completes)
const blockEndEvent: EventMessage = {
    type: MessageType.EVENT,
    props: {
        event: EventType.BLOCK_END,
        message: 'Block completed',
        data: {
            block_id: 'B1',
            type: 'llm',
            timestamp: 1234567895,
            duration_ms: 5000,
            message_count: 3,
            status: 'completed'
        }
    }
}

// Message start event (single logical message begins)
const messageStartEvent: EventMessage = {
    type: MessageType.EVENT,
    props: {
        event: EventType.MESSAGE_START,
        message: 'Message started',
        data: {
            message_id: 'M1',
            type: 'text',
            timestamp: 1234567890
        }
    }
}

// Message end event (single logical message completes)
const messageEndEvent: EventMessage = {
    type: MessageType.EVENT,
    props: {
        event: EventType.MESSAGE_END,
        message: 'Message completed',
        data: {
            message_id: 'M1',
            type: 'text',
            timestamp: 1234567891,
            duration_ms: 150,
            chunk_count: 5,
            status: 'completed',
            extra: {
                content: 'Complete message content here'
            }
        }
    }
}

// Type guards for specific event types
if (IsEventMessage(msg) && IsStreamStartEvent(msg)) {
    // TypeScript knows msg.props.data is StreamStartData
    console.log(msg.props.data?.assistant?.name)
    console.log(msg.props.data?.request_id)
}

if (IsEventMessage(msg) && IsStreamEndEvent(msg)) {
    // TypeScript knows msg.props.data is StreamEndData
    console.log(msg.props.data?.usage?.total_tokens)
    console.log(msg.props.data?.duration_ms)
}

if (IsEventMessage(msg) && IsThreadStartEvent(msg)) {
    // TypeScript knows msg.props.data is ThreadStartData
    console.log('Thread started:', msg.props.data?.thread_id)
    console.log('Label:', msg.props.data?.label)
}

if (IsEventMessage(msg) && IsThreadEndEvent(msg)) {
    // TypeScript knows msg.props.data is ThreadEndData
    console.log('Thread completed:', msg.props.data?.thread_id)
    console.log('Blocks:', msg.props.data?.block_count)
}

if (IsEventMessage(msg) && IsBlockStartEvent(msg)) {
    // TypeScript knows msg.props.data is BlockStartData
    console.log('Block started:', msg.props.data?.block_id)
    console.log('Label:', msg.props.data?.label)
}

if (IsEventMessage(msg) && IsBlockEndEvent(msg)) {
    // TypeScript knows msg.props.data is BlockEndData
    console.log('Block completed:', msg.props.data?.block_id)
    console.log('Messages:', msg.props.data?.message_count)
}

if (IsEventMessage(msg) && IsMessageStartEvent(msg)) {
    // TypeScript knows msg.props.data is MessageStartData
    console.log('Message started:', msg.props.data?.message_id)
    console.log('Type:', msg.props.data?.type)
}

if (IsEventMessage(msg) && IsMessageEndEvent(msg)) {
    // TypeScript knows msg.props.data is MessageEndData
    console.log('Message completed:', msg.props.data?.message_id)
    console.log('Chunks:', msg.props.data?.chunk_count)
    console.log('Duration:', msg.props.data?.duration_ms, 'ms')
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

chat.StreamCompletion({ 
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
            // Other event types (MESSAGE_START, MESSAGE_END, BLOCK_START, BLOCK_END, THREAD_START, THREAD_END, custom events)
            console.log('Event:', chunk.props.event)
        }
        return
    }
    
    // Check for content messages
    if (IsTextMessage(chunk)) {
        if (chunk.delta) {
            // Streaming delta
            process.stdout.write(chunk.props.content)
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

Messages support incremental updates for streaming scenarios. All delta chunks for the same logical message share one `message_id`:

```typescript
// Message start event - marks beginning of a logical message
{
    type: 'event',
    props: {
        event: 'message_start',
        data: { 
            message_id: 'M1', 
            type: 'text',
            timestamp: 1234567890
        }
    }
}

// First chunk (unique chunk_id, shared message_id)
{
    chunk_id: 'C1',
    message_id: 'M1',
    type: 'text',
    delta: true,
    props: { content: 'Hello' }
}

// Second chunk (different chunk_id, same message_id)
{
    chunk_id: 'C2',
    message_id: 'M1',
    type: 'text',
    delta: true,
    props: { content: ', world' }
}

// Third chunk (different chunk_id, same message_id)
{
    chunk_id: 'C3',
    message_id: 'M1',
    type: 'text',
    delta: true,
    props: { content: '!' }
}

// Message end event - signals completion, provides full content
{
    type: 'event',
    props: {
        event: 'message_end',
        data: {
            message_id: 'M1',
            type: 'text',
            timestamp: 1234567891,
            duration_ms: 150,
            chunk_count: 3,
            status: 'completed',
            extra: { content: 'Hello, world!' }
        }
    }
}
```

### Delta Actions

For complex structured messages:

```typescript
{
    chunk_id: 'C5',
    message_id: 'M2',
    type: 'table',
    delta: true,
    delta_path: 'rows',          // Which field to update
    delta_action: 'append',      // How to update: 'append', 'replace', 'merge', 'set'
    props: {
        rows: [{ name: 'Alice', age: 30 }]
    }
}
```

## Message Hierarchy

Messages are organized using a hierarchical structure for complex Agent/LLM/MCP scenarios:

```
Agent Stream (entire conversation)
  └─ ThreadID (T1, T2, T3...) - Concurrent streams (optional)
      └─ BlockID (B1, B2, B3...) - Output blocks/sections
          └─ MessageID (M1, M2, M3...) - Logical messages
              └─ ChunkID (C1, C2, C3...) - Stream fragments
```

**Field Responsibilities:**

| Field | Generated By | Purpose | Example Values |
|-------|-------------|---------|----------------|
| `chunk_id` | System (auto) | Deduplication, ordering, debugging | C1, C2, C3 |
| `message_id` | LLM Provider/Handler | Delta merge target | M1, M2, M3 |
| `block_id` | Agent Logic | UI block/section rendering | B1, B2, B3 |
| `thread_id` | Agent Logic | Concurrent stream distinction | T1, T2, T3 |

### Block Grouping Example

Related messages in one output section share the same `block_id`. Blocks represent semantic units of work from the Agent's perspective (one LLM call, one MCP call, etc.).

```typescript
// Block start event
{
    type: 'event',
    props: {
        event: 'block_start',
        data: { 
            block_id: 'B1',
            type: 'llm',
            timestamp: 1234567890,
            label: 'Analyzing image'
        }
    }
}

// Messages in block (each has unique message_id, shared block_id)
{
    chunk_id: 'C1',
    message_id: 'M1',     // ← Unique message ID
    block_id: 'B1',       // ← Shared block ID
    type: 'thinking',
    props: { content: 'Let me analyze...' }
}
{
    chunk_id: 'C2',
    message_id: 'M2',     // ← Different message ID
    block_id: 'B1',       // ← Same block ID
    type: 'text',
    props: { content: 'This is a sunset at Golden Gate Bridge' }
}

// Block end event
{
    type: 'event',
    props: {
        event: 'block_end',
        message: 'Block completed',
        data: {
            block_id: 'B1',
            type: 'llm',
            timestamp: 1234567895,
            duration_ms: 5000,
            message_count: 2,
            status: 'completed'
        }
    }
}
```

### Thread Concurrency Example

Parallel operations use different `thread_id` values to distinguish concurrent streams. Messages from different threads may arrive in any order.

```typescript
// Thread start events
{
    type: 'event',
    props: {
        event: 'thread_start',
        data: { 
            thread_id: 'T1',
            type: 'mcp',
            timestamp: 1234567890,
            label: 'Weather API call'
        }
    }
}
{
    type: 'event',
    props: {
        event: 'thread_start',
        data: { 
            thread_id: 'T2',
            type: 'mcp',
            timestamp: 1234567890,
            label: 'News API call'
        }
    }
}

// Messages from different threads (may arrive in any order)
{
    chunk_id: 'C1',
    message_id: 'M1',
    block_id: 'B1',
    thread_id: 'T1',      // ← Weather thread
    type: 'text',
    props: { content: 'Weather: Sunny, 25°C' }
}
{
    chunk_id: 'C2',
    message_id: 'M2',
    block_id: 'B2',
    thread_id: 'T2',      // ← News thread
    type: 'text',
    props: { content: 'Latest: Tech summit announced' }
}

// Thread end events
{
    type: 'event',
    props: {
        event: 'thread_end',
        data: {
            thread_id: 'T1',
            type: 'mcp',
            timestamp: 1234567891,
            duration_ms: 1500,
            block_count: 1,
            status: 'completed'
        }
    }
}
{
    type: 'event',
    props: {
        event: 'thread_end',
        data: {
            thread_id: 'T2',
            type: 'mcp',
            timestamp: 1234567892,
            duration_ms: 2000,
            block_count: 1,
            status: 'completed'
        }
    }
}
```

### Handling Messages and Blocks

```typescript
const blocks = new Map<string, Message[]>()
const threads = new Map<string, Message[]>()
const messages = new Map<string, any>()  // For delta merging

chat.StreamCompletion({ ... }, (chunk) => {
    if (IsEventMessage(chunk)) {
        const event = chunk.props.event
        
        // Thread lifecycle (concurrent operations)
        if (event === 'thread_start') {
            const threadId = chunk.props.data?.thread_id
            if (threadId) {
                threads.set(threadId, [])
                console.log('Thread started:', threadId, chunk.props.data?.label)
            }
        } else if (event === 'thread_end') {
            const threadId = chunk.props.data?.thread_id
            if (threadId) {
                const threadMessages = threads.get(threadId)
                console.log('Thread complete:', threadId, threadMessages?.length, 'messages')
                threads.delete(threadId)
            }
        }
        
        // Block lifecycle (output sections)
        else if (event === 'block_start') {
            const blockId = chunk.props.data?.block_id
            if (blockId) {
                blocks.set(blockId, [])
                console.log('Block started:', blockId, chunk.props.data?.label)
            }
        } else if (event === 'block_end') {
            const blockId = chunk.props.data?.block_id
            if (blockId) {
                const blockMessages = blocks.get(blockId)
                console.log('Block complete:', blockId, blockMessages?.length, 'messages')
                renderBlock(blockId, blockMessages)
                blocks.delete(blockId)
            }
        }
        
        // Message lifecycle (individual logical messages)
        else if (event === 'message_start') {
            const messageId = chunk.props.data?.message_id
            console.log('Message started:', messageId, chunk.props.data?.type)
        } else if (event === 'message_end') {
            const messageId = chunk.props.data?.message_id
            if (messageId) {
                console.log('Message completed:', messageId, chunk.props.data?.chunk_count, 'chunks')
                messages.delete(messageId)  // Clean up delta cache
            }
        }
        
        return
    }
    
    // Handle message chunks
    if (chunk.message_id) {
        // Track in thread if thread_id is present
        if (chunk.thread_id && threads.has(chunk.thread_id)) {
            threads.get(chunk.thread_id)!.push(chunk)
        }
        
        // Track in block if block_id is present
        if (chunk.block_id && blocks.has(chunk.block_id)) {
            blocks.get(chunk.block_id)!.push(chunk)
        }
        
        // Merge deltas by message_id
        const merged = applyDelta(chunk.message_id, chunk)
        renderMessage(chunk.message_id, merged)
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
chat.StreamCompletion({
    assistant_id: 'my-assistant',
    messages: [{ role: 'user', content: 'Hi' }]
})

// With chat history (backend loads history using chat_id)
chat.StreamCompletion({
    assistant_id: 'my-assistant',
    chat_id: 'chat-123',
    messages: [{ role: 'user', content: 'Continue our discussion' }]
})

// With advanced options
chat.StreamCompletion({
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
    messages: UserMessage[]         // Required: User input messages
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

### UserMessage (Request Input)

Frontend sends user input messages to backend. Backend manages conversation history.

```typescript
// User message role - roles that frontend can send
type UserMessageRole = 'user' | 'system' | 'developer'

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

// User input message
interface UserMessage {
    role: UserMessageRole        // Frontend typically sends 'user'
    content: string | ContentPart[]  // String or multimodal array
    name?: string                // Optional participant name
}
```

**Usage Examples:**

```typescript
// Simple text message
const textMsg: UserMessage = {
    role: 'user',
    content: 'Hello!'
}

// Multimodal message with image
const imageMsg: UserMessage = {
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
const fileMsg: UserMessage = {
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

**Key Points:**

- ✅ Frontend sends **only the current user input**, not full conversation history
- ✅ Backend manages conversation history using `chat_id`
- ✅ Role is typically `'user'` (99% of cases)
- ✅ `'system'` and `'developer'` roles are for advanced usage

**Data Flow - User Input to Display:**

```
1. User types in InputArea
   ↓
2. Frontend builds UserMessage
   { role: 'user', content: 'Hello' }
   ↓
3. Convert to Message for display
   { type: 'user_input', props: { content: 'Hello', role: 'user' } }
   ↓
4. Display in UI (MessageList)
   Shows as user message bubble
   ↓
5. Send UserMessage to backend
   Backend processes and returns AI response
   ↓
6. Display AI response
   { type: 'text', props: { content: 'Hi! How can I help?' } }
```

**Key Distinction:**

- **`UserMessage`**: API request format (what you send to backend)
- **`Message` with `type: 'user_input'`**: UI display format (what you show in MessageList)
- Frontend automatically converts `UserMessage` → `Message` for display

### Message (Universal DSL)

```typescript
interface Message {
    // Core fields
    type: string                    // Message type (built-in or custom)
    props?: Record<string, any>     // Type-specific properties

    // UI management
    ui_id?: string                  // Frontend-only unique ID for React key (prevents key conflicts when message_id repeats across streams)

    // Hierarchical streaming control
    chunk_id?: string               // Unique chunk ID (C1, C2, C3...; for dedup/ordering/debug)
    message_id?: string             // Logical message ID (M1, M2, M3...; delta merge target; NOTE: may repeat across different streams!)
    block_id?: string               // Block ID (B1, B2, B3...; Agent-level UI section grouping)
    thread_id?: string              // Thread ID (T1, T2, T3...; for concurrent streams)
    
    // Delta control
    delta?: boolean                 // Incremental update flag
    delta_path?: string             // Update path (e.g., "content", "rows")
    delta_action?: 'append' | 'replace' | 'merge' | 'set'

    // Type correction
    type_change?: boolean           // Type correction flag (re-render with new type)

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
interface UserInputProps {
    content: string | ContentPart[] // User input (text or multimodal)
    role?: UserMessageRole          // User role ('user' | 'system' | 'developer')
    name?: string                   // Optional participant name
}

interface TextProps {
    content: string                 // Supports Markdown (AI responses)
}

interface ThinkingProps {
    content: string                 // Reasoning content
}

interface LoadingProps {
    message: string                 // Loading message
}

interface ToolCallProps {
    id?: string
    name?: string
    arguments?: string              // JSON string
    raw?: string                    // Raw tool call data (streamed incrementally via delta)
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
    IsUserInputMessage,
    IsErrorMessage 
} from '@yao/cui/openapi'

// Check if built-in type
if (IsBuiltinMessage(msg)) {
    // msg is one of the 11 built-in types
}

// Specific type checking with type narrowing
if (IsTextMessage(msg)) {
    // TypeScript knows msg.props is TextProps
    console.log(msg.props.content)
}

if (IsUserInputMessage(msg)) {
    // TypeScript knows msg.props is UserInputProps
    console.log('User said:', msg.props.content)
    console.log('Role:', msg.props.role)
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

## Chat Session Management (History API)

The Chat API provides endpoints for managing chat sessions and retrieving historical messages. These APIs enable features like:

- Displaying chat history list with time-based grouping
- Searching and filtering past conversations
- Resuming previous conversations
- Managing chat metadata (title, status, etc.)

### Listing Chat Sessions

```typescript
import { OpenAPI, Chat } from '@yao/cui/openapi'

const api = new OpenAPI({ baseURL: '/v1' })
const chat = new Chat(api)

// List all active sessions (default: sorted by last_message_at desc)
const sessions = await chat.ListSessions()
console.log(sessions.data) // Array of ChatSession

// With pagination (maintains default sort: last_message_at desc)
const page2 = await chat.ListSessions({ 
    page: 2, 
    pagesize: 20 
})

// Filter by assistant
const assistantChats = await chat.ListSessions({ 
    assistant_id: 'my-assistant' 
})

// Search by keywords (searches in title)
const searchResults = await chat.ListSessions({ 
    keywords: 'project planning' 
})

// Filter by status
const archived = await chat.ListSessions({ 
    status: 'archived' 
})

// Time range filter
const thisWeek = await chat.ListSessions({
    start_time: '2024-01-01T00:00:00Z',
    end_time: '2024-01-07T23:59:59Z',
    time_field: 'last_message_at' // or 'created_at'
})

// Custom sorting
const byCreated = await chat.ListSessions({
    order_by: 'created_at',
    order: 'asc'
})
```

### Time-Based Grouping

For chat list UIs with time-based sections (Today, Yesterday, This Week, etc.):

```typescript
// Enable time-based grouping
const grouped = await chat.ListSessions({ 
    group_by: 'time' 
})

// Response includes both flat list and grouped data
console.log(grouped.data)   // All chats in flat array
console.log(grouped.groups) // Time-based groups

// groups structure:
// [
//   { label: "Today", key: "today", chats: [...], count: 5 },
//   { label: "Yesterday", key: "yesterday", chats: [...], count: 3 },
//   { label: "This Week", key: "this_week", chats: [...], count: 12 },
//   { label: "This Month", key: "this_month", chats: [...], count: 8 },
//   { label: "Earlier", key: "earlier", chats: [...], count: 20 }
// ]

// Render grouped chat list
function renderChatList(sessions: ChatSessionList) {
    if (sessions.groups && sessions.groups.length > 0) {
        return sessions.groups.map(group => (
            <div key={group.key}>
                <h3>{group.label}</h3>
                {group.chats.map(chat => (
                    <ChatItem key={chat.chat_id} chat={chat} />
                ))}
            </div>
        ))
    }
    
    // Fallback to flat list
    return sessions.data.map(chat => (
        <ChatItem key={chat.chat_id} chat={chat} />
    ))
}
```

### Getting a Single Chat Session

```typescript
// Get chat details by ID
const chatSession = await chat.GetSession('chat-123')
console.log(chatSession.title)
console.log(chatSession.assistant_id)
console.log(chatSession.last_message_at)
```

### Updating Chat Sessions

```typescript
// Update title (e.g., after auto-generating from first message)
await chat.UpdateSession('chat-123', { 
    title: 'Project Planning Discussion' 
})

// Archive a chat
await chat.UpdateSession('chat-123', { 
    status: 'archived' 
})

// Update with custom metadata
await chat.UpdateSession('chat-123', {
    metadata: {
        pinned: true,
        category: 'work'
    }
})
```

### Deleting Chat Sessions

```typescript
// Soft delete a chat (can be recovered)
await chat.DeleteSession('chat-123')
```

### Retrieving Chat Messages (History)

```typescript
// Get all messages for a chat (sorted by created_at asc, then sequence asc - oldest first)
const messages = await chat.GetMessages('chat-123')
console.log(messages.messages)   // Array of ChatMessage
console.log(messages.count)      // Total message count
console.log(messages.assistants) // Map of assistant_id -> AssistantInfo (localized)

// With locale parameter for localized assistant info
// Priority: 1. Query param "locale", 2. Accept-Language header
const messagesZh = await chat.GetMessages('chat-123', { locale: 'zh-cn' })
const messagesEn = await chat.GetMessages('chat-123', { locale: 'en-us' })

// With pagination (always sorted by sequence asc)
// Use offset to skip earlier messages, limit to control page size
const firstPage = await chat.GetMessages('chat-123', {
    limit: 50,
    offset: 0
})

// Filter by role
const userMessages = await chat.GetMessages('chat-123', { 
    role: 'user' 
})
const assistantMessages = await chat.GetMessages('chat-123', { 
    role: 'assistant' 
})

// Filter by message type
const textOnly = await chat.GetMessages('chat-123', { 
    type: 'text' 
})
const toolCalls = await chat.GetMessages('chat-123', { 
    type: 'tool_call' 
})

// Filter by request (all messages from a single request)
const requestMessages = await chat.GetMessages('chat-123', { 
    request_id: 'req-456' 
})

// Filter by block or thread (for complex agent flows)
const blockMessages = await chat.GetMessages('chat-123', { 
    block_id: 'B1' 
})
const threadMessages = await chat.GetMessages('chat-123', { 
    thread_id: 'T1' 
})
```

### Complete History Integration Example

Here's a complete example showing how to integrate chat history into your application:

```typescript
import { OpenAPI, Chat, ChatSession, ChatMessage, Message } from '@yao/cui/openapi'
import { nanoid } from 'nanoid'

const api = new OpenAPI({ baseURL: '/v1' })
const chat = new Chat(api)

// ============================================================
// State Management
// ============================================================

interface ChatState {
    currentChatId: string | null
    sessions: ChatSession[]
    messages: Message[]
    isLoading: boolean
}

const state: ChatState = {
    currentChatId: null,
    sessions: [],
    messages: [],
    isLoading: false
}

// ============================================================
// Load Chat History List
// ============================================================

async function loadChatList() {
    state.isLoading = true
    try {
        const result = await chat.ListSessions({
            group_by: 'time',
            pagesize: 50
        })
        state.sessions = result.data
        renderChatList(result)
    } finally {
        state.isLoading = false
    }
}

// ============================================================
// Resume a Previous Chat
// ============================================================

async function resumeChat(chatId: string) {
    state.currentChatId = chatId
    state.isLoading = true
    
    try {
        // 1. Load chat session details
        const session = await chat.GetSession(chatId)
        
        // 2. Load historical messages
        const history = await chat.GetMessages(chatId)
        
        // 3. Convert stored messages to display format
        state.messages = history.messages.map(convertStoredToDisplay)
        
        // 4. Render messages
        renderMessages(state.messages)
        
        console.log(`Resumed chat: ${session.title || 'Untitled'}`)
    } finally {
        state.isLoading = false
    }
}

// Convert stored ChatMessage to display Message format
function convertStoredToDisplay(stored: ChatMessage): Message {
    return {
        ui_id: nanoid(), // Generate unique UI ID for React key
        message_id: stored.message_id,
        type: stored.type,
        props: stored.props,
        block_id: stored.block_id,
        thread_id: stored.thread_id,
        delta: false, // Historical messages are complete
        metadata: {
            timestamp: new Date(stored.created_at).getTime()
        }
    }
}

// ============================================================
// Start New Chat
// ============================================================

function startNewChat(assistantId: string) {
    // Generate chat_id on frontend (recommended)
    state.currentChatId = nanoid()
    state.messages = []
    
    console.log(`Started new chat: ${state.currentChatId}`)
}

// ============================================================
// Send Message (with history continuation)
// ============================================================

async function sendMessage(content: string) {
    if (!state.currentChatId) {
        console.error('No chat selected')
        return
    }
    
    // Add user message to display immediately
    const userMessage: Message = {
        ui_id: nanoid(),
        type: 'user_input',
        props: { content, role: 'user' },
        delta: false
    }
    state.messages.push(userMessage)
    renderMessages(state.messages)
    
    // Stream completion
    // Note: Backend manages history using chat_id
    // Frontend only sends current user input
    chat.StreamCompletion(
        {
            assistant_id: 'my-assistant',
            chat_id: state.currentChatId,  // Continue this chat
            messages: [
                { role: 'user', content }  // Only current input
            ]
        },
        (chunk) => {
            handleStreamChunk(chunk)
        },
        (error) => {
            console.error('Stream error:', error)
        }
    )
}

// ============================================================
// Handle Streaming Response
// ============================================================

let streamId: string = ''
const completedMessages = new Set<string>()

function handleStreamChunk(chunk: Message) {
    // Handle stream lifecycle
    if (chunk.type === 'event') {
        if (chunk.props?.event === 'stream_start') {
            streamId = nanoid()
            completedMessages.clear()
            return
        }
        if (chunk.props?.event === 'message_end') {
            const msgId = chunk.props.data?.message_id
            if (msgId) {
                completedMessages.add(`${streamId}:${msgId}`)
            }
            return
        }
        if (chunk.props?.event === 'stream_end') {
            // Optionally refresh chat list to update last_message_at
            loadChatList()
            return
        }
        return
    }
    
    // Handle content messages
    if (chunk.message_id) {
        const namespacedId = `${streamId}:${chunk.message_id}`
        const isCompleted = completedMessages.has(namespacedId)
        
        // Find or create message in state
        const existingIndex = state.messages.findIndex(
            m => m.message_id === namespacedId
        )
        
        if (existingIndex >= 0) {
            // Update existing message (delta merge)
            state.messages[existingIndex] = {
                ...state.messages[existingIndex],
                props: mergeProps(state.messages[existingIndex].props, chunk),
                delta: isCompleted ? false : chunk.delta
            }
        } else {
            // Add new message
            state.messages.push({
                ui_id: nanoid(),
                message_id: namespacedId,
                type: chunk.type,
                props: chunk.props || {},
                block_id: chunk.block_id,
                thread_id: chunk.thread_id,
                delta: isCompleted ? false : chunk.delta
            })
        }
        
        renderMessages(state.messages)
    }
}

// Simple props merging for delta updates
function mergeProps(existing: any, chunk: Message): any {
    if (!chunk.delta) return chunk.props
    
    const result = { ...existing }
    const action = chunk.delta_action || 'append'
    
    if (action === 'append') {
        Object.keys(chunk.props || {}).forEach(key => {
            if (typeof result[key] === 'string' && typeof chunk.props?.[key] === 'string') {
                result[key] = result[key] + chunk.props[key]
            } else {
                result[key] = chunk.props?.[key]
            }
        })
    } else {
        Object.assign(result, chunk.props)
    }
    
    return result
}

// ============================================================
// Auto-Generate Title (after first response)
// ============================================================

async function autoGenerateTitle(chatId: string, firstUserMessage: string) {
    // Use a system assistant to generate title
    // Note: Use skip.history to avoid saving this as chat history
    let title = ''
    
    chat.StreamCompletion(
        {
            assistant_id: 'workers.system.title',
            messages: [
                { role: 'user', content: `Generate a short title for: ${firstUserMessage}` }
            ],
            skip: {
                history: true,  // Don't save this tool call
                trace: true     // Skip trace for performance
            }
        },
        (chunk) => {
            if (chunk.type === 'text' && chunk.props?.content) {
                title += chunk.props.content
            }
        },
        async () => {
            // Update chat title
            if (title) {
                await chat.UpdateSession(chatId, { title: title.trim() })
                loadChatList() // Refresh list to show new title
            }
        }
    )
}

// ============================================================
// Delete Chat
// ============================================================

async function deleteChat(chatId: string) {
    if (confirm('Delete this chat?')) {
        await chat.DeleteSession(chatId)
        
        // If deleting current chat, clear state
        if (state.currentChatId === chatId) {
            state.currentChatId = null
            state.messages = []
        }
        
        // Refresh list
        loadChatList()
    }
}

// ============================================================
// Archive Chat
// ============================================================

async function archiveChat(chatId: string) {
    await chat.UpdateSession(chatId, { status: 'archived' })
    loadChatList()
}

// ============================================================
// Render Functions (placeholder - implement with your UI framework)
// ============================================================

function renderChatList(sessions: any) {
    console.log('Render chat list:', sessions)
}

function renderMessages(messages: Message[]) {
    console.log('Render messages:', messages.length)
}

// ============================================================
// Initialize
// ============================================================

loadChatList()
```

### Chat Session Types Reference

```typescript
// Chat session status
type ChatStatus = 'active' | 'archived'

// Chat sharing scope
type ChatShare = 'private' | 'team'

// Chat session object
interface ChatSession {
    chat_id: string
    title?: string
    assistant_id: string
    last_connector?: string   // Last used connector ID (updated on each message)
    last_mode?: string        // Last used chat mode (updated on each message)
    status: ChatStatus
    public?: boolean      // Whether shared across all teams
    share?: ChatShare     // "private" or "team"
    sort?: number         // Sort order for display
    last_message_at?: string  // ISO 8601 datetime
    metadata?: Record<string, any>
    created_at: string    // ISO 8601 datetime
    updated_at: string    // ISO 8601 datetime
}

// Filter for listing sessions
interface ChatSessionFilter {
    assistant_id?: string
    status?: ChatStatus
    keywords?: string
    // Time range filter
    start_time?: string   // ISO 8601 datetime
    end_time?: string     // ISO 8601 datetime
    time_field?: 'created_at' | 'last_message_at'
    // Sorting (default: last_message_at desc)
    order_by?: 'created_at' | 'updated_at' | 'last_message_at'
    order?: 'asc' | 'desc'
    // Response format
    group_by?: 'time'     // "time" for time-based groups
    // Pagination
    page?: number
    pagesize?: number
}

// Time-based group
interface ChatGroup {
    label: string   // "Today", "Yesterday", "This Week", "This Month", "Earlier"
    key: string     // "today", "yesterday", "this_week", "this_month", "earlier"
    chats: ChatSession[]
    count: number
}

// Paginated response
interface ChatSessionList {
    data: ChatSession[]
    groups?: ChatGroup[]  // Time-based groups (when group_by=time)
    page: number
    pagesize: number
    pagecount: number
    total: number
}

// Stored message
interface ChatMessage {
    message_id: string
    chat_id: string
    request_id?: string
    role: 'user' | 'assistant'
    type: string          // "text", "image", "tool_call", "retrieval", etc.
    props: Record<string, any>
    block_id?: string
    thread_id?: string
    assistant_id?: string
    connector?: string    // Connector ID used for this message
    mode?: string         // Chat mode used for this message (chat or task)
    sequence: number
    metadata?: Record<string, any>
    created_at: string    // ISO 8601 datetime
    updated_at: string    // ISO 8601 datetime
}

// Message filter (sorted by created_at asc, then sequence asc - chronological order)
interface ChatMessageFilter {
    request_id?: string
    role?: 'user' | 'assistant'
    block_id?: string
    thread_id?: string
    type?: string
    limit?: number    // Max messages to return (default: 100)
    offset?: number   // Skip first N messages
    locale?: string   // Locale for assistant info (e.g., "zh-cn", "en-us")
                      // Falls back to Accept-Language header if not provided
}

// Assistant info (localized based on locale parameter)
interface AssistantInfo {
    assistant_id: string
    name: string
    avatar?: string
    description?: string
}

// GetMessages response
interface ChatMessagesResponse {
    chat_id: string
    messages: ChatMessage[]
    count: number
    assistants?: Record<string, AssistantInfo>  // Map of assistant_id -> AssistantInfo
}
```

### Permission and Access Control

Chat sessions support Yao's unified permission management:

- **Private chats**: Only the creator can access
- **Team chats**: Team members can access if `share: 'team'`
- **Public chats**: All users can read if `public: true`

The API automatically applies permission filters based on the authenticated user's credentials:

```typescript
// Permission is handled automatically by the backend
// The API returns only chats the user has permission to access

// For admin users (no constraints): sees all chats
// For team members (TeamOnly): sees own + team shared chats
// For regular users (OwnerOnly): sees only own chats
```

### Best Practices

1. **Generate `chat_id` on frontend** - Avoids backend hash computation overhead
2. **Use time-based grouping** - Better UX for chat list display
3. **Implement infinite scroll** - Use pagination for large chat histories
4. **Auto-generate titles** - Use `skip.history: true` for title generation calls
5. **Handle offline gracefully** - Cache chat list and messages locally
6. **Namespace `message_id`** - Use stream-level namespace to prevent conflicts

## See Also

- [Trace API](../trace/README.md) - Debugging and tracing
- [Agent API](../agent/README.md) - Assistant management
- Backend: `yao/agent/output/README.md` - Output module documentation
- Backend: `yao/agent/output/BUILTIN_TYPES.md` - Built-in types reference

