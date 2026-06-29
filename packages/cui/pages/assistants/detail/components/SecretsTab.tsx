import SecretsManager from '@/components/SecretsManager'

interface SecretsTabProps {
	assistantId: string
}

const SecretsTab = ({ assistantId }: SecretsTabProps) => {
	return <SecretsManager assistantId={assistantId} />
}

export default SecretsTab
