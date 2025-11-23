import React from 'react'
import { useChatContext } from '@/chatbox/context'
import styles from './index.less'

const Index = () => {
    const { sessions, loadHistory, currentChatId } = useChatContext()

	return (
        <div className={styles._local} style={{ padding: 12 }}>
            <h3 style={{ padding: '0 4px', marginBottom: 8 }}>Recent Chats</h3>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sessions.map(session => (
                    <div 
                        key={session.chat_id}
                        onClick={() => loadHistory(session.chat_id)}
                        style={{
                            padding: '10px 12px',
                            background: currentChatId === session.chat_id ? 'var(--color_neo_bg_selected)' : 'var(--color_neo_bg_card)',
                            borderRadius: 8,
                            cursor: 'pointer',
                            border: currentChatId === session.chat_id ? '1px solid var(--color_neo_border_selected)' : '1px solid var(--color_neo_border_card)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--color_text)' }}>{session.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--color_text_grey)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {session.last_message}
                        </div>
                    </div>
                ))}
            </div>
		</div>
	)
}

export default Index
