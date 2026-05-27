import React from 'react'
import { ErrorBoundary } from 'react-error-boundary'

interface FallbackProps {
	error: Error
	fallbackContent: string
}

const Fallback = ({ error, fallbackContent }: FallbackProps) => (
	<div style={{ whiteSpace: 'pre-wrap' }}>{fallbackContent}</div>
)

interface MdxErrorBoundaryProps {
	children: React.ReactNode
	fallbackContent: string
	resetKeys?: any[]
}

const MdxErrorBoundary = ({ children, fallbackContent, resetKeys }: MdxErrorBoundaryProps) => (
	<ErrorBoundary
		resetKeys={resetKeys}
		fallbackRender={({ error }) => <Fallback error={error} fallbackContent={fallbackContent} />}
	>
		{children}
	</ErrorBoundary>
)

export default MdxErrorBoundary
