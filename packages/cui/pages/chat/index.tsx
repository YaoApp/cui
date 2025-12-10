import { FC } from 'react'
import './index.less'

/**
 * Chat Welcome Page
 * This is the default landing page for the chat interface
 */
const ChatWelcome: FC = () => {
	return (
		<div className='chat-welcome'>
			<div className='welcome-content'>
				<h1>Welcome</h1>
				<p>Start a conversation with the AI assistant</p>
			</div>
		</div>
	)
}

export default ChatWelcome
