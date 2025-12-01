import React from 'react'
import type { CustomMessage } from '../../../openapi'

interface ICustomProps {
	message: CustomMessage
}

const Custom = ({ message }: ICustomProps) => {
	return (
		<div style={{ marginBottom: '24px' }}>
			{/* TODO: Implement Custom component - fallback for unknown types */}
			<div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
				<div style={{ color: '#666', marginBottom: '4px' }}>
					<strong>Type:</strong> {message.type}
				</div>
				<div style={{ color: '#666' }}>
					<strong>Props:</strong>
				</div>
				<pre
					style={{
						background: '#f5f5f5',
						padding: '8px',
						borderRadius: '4px',
						overflow: 'auto',
						maxWidth: '100%'
					}}
				>
					{JSON.stringify(message.props, null, 2)}
				</pre>
			</div>
		</div>
	)
}

export default Custom
