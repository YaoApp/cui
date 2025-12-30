import { memo } from 'react'
import AgentOutput from './AgentOutput'
import LLMOutput from './LLMOutput'
import DefaultOutput from './DefaultOutput'

interface OutputPanelProps {
	type: string
	output?: Record<string, any> | string
	status: 'pending' | 'running' | 'success' | 'error'
	error?: string
	is_cn?: boolean
}

const OutputPanel: React.FC<OutputPanelProps> = ({ type, output, status, error, is_cn = false }) => {
	// 根据节点类型选择不同的输出组件
	switch (type) {
		case 'agent':
			return <AgentOutput output={output} status={status} error={error} is_cn={is_cn} />
		case 'llm':
			return <LLMOutput output={output} status={status} error={error} is_cn={is_cn} />
		default:
			return <DefaultOutput output={output} status={status} error={error} is_cn={is_cn} />
	}
}

export default memo(OutputPanel)
