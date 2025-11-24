# Message Queue Feature

## Overview

The Message Queue feature allows users to queue multiple messages while the AI is still streaming a response. This improves the chat experience by allowing continuous interaction without waiting for each response to complete.

## Core Concepts

### Two Message Sending Approaches

1. **Graceful Mode (Queue and Wait)**:
   - Messages are sent to backend immediately via `AppendMessages` API with `type: 'graceful'`
   - Messages are also added to local UI queue for display
   - Backend will process them when the current AI response completes
   - Used when user presses Enter with non-empty input while streaming

2. **Force Mode (Interrupt and Send)**:
   - All queued messages are sent together via `AppendMessages` API with `type: 'force'`
   - UI queue is cleared immediately
   - Backend interrupts current processing and handles queued messages
   - Used when:
     - User presses Enter with empty input (and queue has messages)
     - User clicks "立即发送" button in queue UI

### Auto-Send on Stream End

When the AI finishes responding (`stream_end` event):
- If the local queue has messages, they are sent as a **new `StreamCompletion`** request (not `AppendMessages`)
- The queue is cleared from UI
- A new streaming session starts to process all queued messages

**Important**: This is different from graceful/force modes which use `AppendMessages` API.

## User Interaction Flow

### Scenario 1: Press Enter While Streaming (Non-Empty Input)

1. User types a message while AI is streaming
2. User presses Enter
3. Frontend:
   - Adds message to local queue (UI displays it)
   - Immediately calls `AppendMessages(contextId, [message], 'graceful')`
   - Clears input field
4. Message stays in UI queue until backend processes it or stream ends

### Scenario 2: Press Enter While Streaming (Empty Input)

1. User has messages in queue (from Scenario 1)
2. User presses Enter with empty input
3. Frontend:
   - Extracts all messages from queue
   - Calls `AppendMessages(contextId, [all messages], 'force')`
   - Immediately clears UI queue (doesn't wait for backend)
4. Backend interrupts current processing and handles messages

### Scenario 3: Click "立即发送" Button

Same behavior as Scenario 2 (force send all queued messages).

### Scenario 4: Stream Ends with Queued Messages

1. AI finishes streaming (`stream_end` event received)
2. Frontend checks if local queue has messages
3. If yes:
   - Extracts all messages from queue
   - Clears UI queue
   - Starts a **new `StreamCompletion`** with all queued messages
4. New streaming session begins

## Architecture

### Component Structure

```
Page
├── Header (tabs management)
└── Chatbox
    ├── MessageList (scrollable messages)
    ├── MessageQueue (above InputArea, conditionally rendered)
    └── InputArea (user input with integrated send button)
```

### State Management

All message queue state is managed in `useChat` hook:

```typescript
interface QueuedMessage {
  id: string
  message: ChatMessage
  type: 'graceful' | 'force'
  timestamp: number
}

// Per-tab queue state (stored in useChat)
messageQueues: Record<chatId, QueuedMessage[]>
```

### Key Functions in useChat

#### 1. `queueMessage(message, type)`
```typescript
// Add message to local queue AND send to backend immediately
queueMessage(message: ChatMessage, type: 'graceful' | 'force' = 'graceful') {
  // Add to UI queue
  setMessageQueues(prev => ({
    ...prev,
    [activeTabId]: [...prev[activeTabId], { id, message, type, timestamp }]
  }))
  
  // Immediately send to backend via AppendMessages
  chatClient.AppendMessages(contextId, [message], 'graceful')
}
```

#### 2. `sendQueuedMessage(queueId, asForce)`
```typescript
// Force send ALL queued messages (ignore queueId parameter)
sendQueuedMessage(queueId: string, asForce: boolean = true) {
  const allMessages = messageQueues[activeTabId].map(q => q.message)
  
  // Send all via AppendMessages with force type
  appendQueuedMessages(allMessages, activeTabId, 'force')
  
  // Clear UI queue immediately (don't wait for backend)
  setMessageQueues(prev => ({ ...prev, [activeTabId]: [] }))
}
```

#### 3. `cancelQueuedMessage(queueId)`
```typescript
// Remove message from local UI queue only
cancelQueuedMessage(queueId: string) {
  setMessageQueues(prev => {
    const newQueue = prev[activeTabId].filter(m => m.id !== queueId)
    return { ...prev, [activeTabId]: newQueue }
  })
}
```

**Note**: Canceling only removes from UI queue. If already sent to backend via graceful mode, it will still be processed.

#### 4. `startNewStreamWithMessages(messages, tabId, assistantId)`
```typescript
// Start a NEW StreamCompletion with queued messages
// Used when stream_end event fires and queue has messages
startNewStreamWithMessages(messages, tabId, assistantId) {
  // Set streaming state
  setStreamingStates(prev => ({ ...prev, [tabId]: true }))
  
  // Add user messages to UI
  updateMessages(tabId, prev => [...prev, ...userMessages])
  
  // Start new stream
  chatClient.StreamCompletion({
    assistant_id: assistantId,
    chat_id: tabId,
    messages: messages // All queued messages together
  }, handleChunk)
}
```

### Event Handling in sendMessage

```typescript
// Inside StreamCompletion callback
if (chunk.type === 'event') {
  if (chunk.props.event === 'stream_start') {
    // Capture context_id for AppendMessages
    contextIdsRef.current[chatId] = chunk.props.data.context_id
  }
  
  if (chunk.props.event === 'stream_end') {
    setStreamingStates(prev => ({ ...prev, [chatId]: false }))
    
    // If queue has messages, start new stream with them
    setMessageQueues(prev => {
      const queue = prev[chatId] || []
      if (queue.length > 0) {
        const allMessages = queue.map(q => q.message)
        
        // Start new StreamCompletion
        startNewStreamWithMessages(allMessages, chatId, assistantId)
        
        // Clear queue
        return { ...prev, [chatId]: [] }
      }
      return prev
    })
  }
}
```

## API Interactions

### Two Different APIs Used

1. **`AppendMessages` API**:
   - Endpoint: `POST /chat/completions/:context_id/append`
   - Used for: Graceful and Force modes
   - Stream: Existing stream stays open
   - Payload:
     ```typescript
     {
       messages: ChatMessage[],
       interrupt: {
         type: 'graceful' | 'force',
         message: [] // Empty for force cancel
       }
     }
     ```

2. **`StreamCompletion` API**:
   - Endpoint: `POST /chat/completions`
   - Used for: Auto-send on stream_end
   - Stream: Creates new streaming connection
   - Payload:
     ```typescript
     {
       assistant_id: string,
       chat_id: string,
       messages: ChatMessage[]
     }
     ```

## UI Components

### MessageQueue Component

**Props**:
```typescript
interface IMessageQueueProps {
  queue: QueuedMessage[]
  onCancel: (id: string) => void
  onSendNow: (id: string) => void
  onSendAll: () => void
  className?: string
}
```

**Features**:
- Shows header with count: "等待发送 (2)"
- Each item displays message preview (first 50 characters)
- Actions per item:
  - Send icon (△): Sends all queued messages immediately (force)
  - Cancel icon (×): Removes from UI queue
- "立即发送" button at top-right: Sends all queued messages (force)
- Positioned to overlap InputArea slightly (glassmorphism effect)

**Styling**:
- Uses chatbox color variables for consistency
- Semi-transparent background with backdrop blur
- Responsive to light/dark themes

### InputArea Component

**Props**:
```typescript
interface IInputAreaProps {
  streaming?: boolean
  messageQueue?: QueuedMessage[]
  onQueueMessage?: (message: ChatMessage, type: InterruptType) => void
  onSendQueuedMessage?: (queueId: string, asForce: boolean) => void
  onCancelQueuedMessage?: (queueId: string) => void
  // ... other props
}
```

**Enter Key Behavior**:
```typescript
handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    if (streaming) {
      handleQueueSend() // Queue logic
    } else {
      handleSend() // Normal send
    }
  }
}

handleQueueSend() {
  const message = constructMessage()
  
  if (!message && messageQueue.length > 0) {
    // Empty input + has queue → Force send all
    onSendQueuedMessage(messageQueue[0].id, true)
  } else if (message) {
    // Has input → Queue it (graceful)
    onQueueMessage(message, 'graceful')
    clearInput()
  }
}
```

**Placeholder Text** (when streaming):
- Without queue: "可继续输入（回车键排队，空回车立即发送）"
- With queue: "继续输入（回车键排队）或空回车立即发送队列"

**Send Button**:
- Icon: `PaperPlaneTilt` (phosphor-react) for send, `Stop` for stop
- Position: Float on top-right of text area (z-index: 10)
- Size: 30px × 30px, icon 16px
- Background: Semi-transparent with icon color (glassmorphism)
  - Disabled: Grey background + grey icon
  - Active: Blue background + blue icon
  - Stopping: Orange background + orange icon with breathing animation
- No shadow, circular, scales 1.1x on hover

## Visual Design

### MessageQueue Positioning

```less
.messageQueue {
  max-width: 650px; // Narrower than InputArea
  margin: 0 auto -32px; // Overlap InputArea
  padding-bottom: 16px;
  position: relative;
  z-index: 0; // Below InputArea
}
```

The queue overlaps slightly with InputArea, creating a layered glassmorphism effect.

### Color System

All components use chatbox color variables:
- `--color_chatbox_bg_card`: Component backgrounds
- `--color_chatbox_border_card`: Borders
- `--color_chatbox_text_primary`: Primary text
- `--color_chatbox_text_secondary`: Secondary text/icons
- `--color_primary`: Active send button
- `--color_warning`: Stop button (with breathing animation)

## Complete Flow Example

### User queues 2 messages while AI is responding:

1. **User types "message 1"** and presses Enter (streaming = true)
   - Added to UI queue
   - `AppendMessages(contextId, [msg1], 'graceful')` called
   - Input cleared

2. **User types "message 2"** and presses Enter
   - Added to UI queue (now shows: "等待发送 (2)")
   - `AppendMessages(contextId, [msg2], 'graceful')` called
   - Input cleared

3. **AI finishes streaming** (`stream_end` event)
   - Frontend checks queue → has 2 messages
   - Clears UI queue
   - Calls `StreamCompletion({ messages: [msg1, msg2] })`
   - New streaming session starts with both messages

4. **AI processes both messages** and streams responses

### User wants to send queued messages immediately:

1. User has 2 messages in queue (from above)
2. User presses Enter with empty input (or clicks "立即发送")
3. Frontend:
   - Extracts [msg1, msg2] from queue
   - Calls `AppendMessages(contextId, [msg1, msg2], 'force')`
   - Immediately clears UI queue
4. Backend interrupts current processing
5. Backend processes both messages

## Implementation Checklist

- [x] Queue messages while streaming
- [x] Display queue above InputArea
- [x] Empty Enter sends all queued (force)
- [x] Non-empty Enter queues message (graceful)
- [x] "立即发送" button sends all (force)
- [x] Cancel button removes from UI queue
- [x] Auto-send on stream_end (new StreamCompletion)
- [x] Per-tab queue state isolation
- [x] Queue cleared when tab closes
- [x] Visual integration with glassmorphism
- [x] Light/dark theme support
- [x] Send button with dynamic icon/color
- [x] Breathing animation for stop button
- [x] Placeholder text reflects queue state

## Key Implementation Details

1. **Queue Storage**: Only in frontend (`messageQueues` in useChat)
2. **Backend Communication**:
   - Graceful: Individual `AppendMessages` calls with `type: 'graceful'`
   - Force: Batch `AppendMessages` call with `type: 'force'` and all messages
   - Auto-send: New `StreamCompletion` with all messages
3. **Context ID**: Captured from `stream_start` event, stored in `contextIdsRef`
4. **Queue Clearing**:
   - Force mode: Immediate (UI only)
   - Stream end: Immediate before starting new stream
5. **Cancel**: Only removes from UI, backend may still process if already sent
6. **No `queue_processed` event**: Queue clearing is handled by frontend logic

## Notes

- The queue is per-tab and isolated
- Queue is lost on page refresh (in-memory only)
- Messages sent via graceful mode cannot be truly canceled (already sent to backend)
- Force mode uses `AppendMessages` API (not stop button)
- Stop button (`onAbort`) uses `AppendMessages` with empty message array to signal cancellation
- Stream end behavior creates a new streaming session (not using AppendMessages)
