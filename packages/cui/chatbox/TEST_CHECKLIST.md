# Chatbox Architecture Refactoring - Test Checklist

## ✅ Code Structure Check

- [x] Chatbox component created (`components/Chatbox/index.tsx`)
- [x] Page component refactored, using Header + Chatbox architecture
- [x] All components properly exported (`components/index.ts`)
- [x] Main entry file updated (`index.ts`)
- [x] No linter errors

## 🧪 Functional Testing Points

### 1. Tab Management
- [ ] Generate unique chat_id when creating new tab
- [ ] Correctly inherit assistant_id when creating new tab
- [ ] Display corresponding message history when switching tabs
- [ ] Input clears when switching tabs (no draft state)
- [ ] Clean up corresponding state when closing tab
- [ ] Automatically switch to another tab when closing active tab
- [ ] Input auto-focuses when switching tabs

### 2. Message Sending
- [ ] Auto-create conversation when sending message in empty tab
- [ ] Messages correctly displayed in corresponding tab
- [ ] Streaming response updates in real-time
- [ ] Can abort ongoing response
- [ ] Input remains focused after sending message
- [ ] Can pre-type next message while AI is streaming (Input not disabled)

### 3. State Isolation
- [ ] Each tab's message list is independent
- [ ] Each tab's input resets when switching (no draft preservation)
- [ ] Each tab can use different assistant
- [ ] Tab A streaming doesn't affect Tab B's input state

### 4. Assistant Management
- [ ] New tab inherits assistant from current tab by default
- [ ] Can specify different assistant for new tab
- [ ] Correctly displays current assistant information
- [ ] Updates assistant information when switching tabs

### 5. UI/UX & Layout
- [ ] Display placeholder mode in empty state
- [ ] Display normal mode when messages exist
- [ ] Load history shows loading state
- [ ] Header correctly shows/hides in tabs mode
- [ ] **MessageList scrolls independently, Header and InputArea remain fixed**
- [ ] **InputArea height auto-adjusts without breaking layout**
- [ ] **No double scrollbars on the page**

## 📝 Component Interface Check

### Chatbox Props
```typescript
✅ messages: Message[]           // Message list
✅ loading?: boolean             // Loading history
✅ streaming?: boolean           // Streaming output
✅ chatId: string                // Chat ID
✅ assistantId?: string          // Assistant ID
✅ assistant?: AssistantInfo     // Assistant info
✅ onSend: (msg) => Promise      // Send callback
✅ onAbort?: () => void          // Abort callback
```

### Context API
```typescript
✅ messages                      // Current tab's messages
✅ tabs                         // Tab list
✅ activeTabId                  // Active tab ID
✅ assistant                    // Current assistant info
✅ sendMessage(msg)             // Send message
✅ createNewChat(assistantId?)  // Create new chat
✅ activateTab(chatId)          // Activate tab
✅ closeTab(chatId)             // Close tab
```

## 🔍 Manual Testing Scenarios

### Scenario 1: Multi-Tab Conversations
1. Create first tab, send message
2. Create second tab, confirm assistant is inherited
3. Send different message in second tab
4. Switch back to first tab, confirm message history is correct
5. Input text in both tabs but don't send
6. Switch tabs, confirm input clears (independent state)

### Scenario 2: Assistant Switching
1. Create conversation with default assistant
2. Create new tab with different assistant
3. Confirm two tabs use different assistants
4. Create third tab from second tab
5. Confirm third tab inherits second tab's assistant

### Scenario 3: Tab Closing
1. Open multiple tabs
2. Close middle tab, confirm doesn't affect other tabs
3. Close current active tab, confirm auto-switches to another tab
4. Close all tabs, confirm returns to empty state

### Scenario 4: Streaming Response
1. Send message to trigger streaming response
2. Switch to another tab during response
3. Switch back, confirm response continues displaying
4. Test abort functionality
5. Confirm Tab B's input remains available while Tab A is streaming

### Scenario 5: Long Content & Layout
1. Send a message that generates a long response
2. Confirm MessageList scrolls while InputArea stays fixed at bottom
3. Confirm Header stays fixed at top
4. Type a long message in InputArea to increase its height
5. Confirm layout adjusts correctly (MessageList shrinks but remains scrollable)

## ✨ Architecture Advantages Verification

- [x] Clear component responsibilities, easy to understand
- [x] State management centralized in useChat hook
- [x] Chatbox component highly reusable
- [x] Clear props passing, no implicit dependencies
- [x] Each tab's state is completely independent
- [x] Easy to extend with new features

## 📚 Documentation Completeness

- [x] Architecture documentation (ARCHITECTURE.md)
- [x] Test checklist (TEST_CHECKLIST.md)
- [x] Code comments complete
- [x] TypeScript type definitions complete
