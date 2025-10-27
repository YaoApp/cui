export interface GeneratorProps {
	/** Avatar agent ID */
	avatarAgent: string
	/** Generate success callback */
	onSuccess: (fileId: string, fileUrl: string) => void
}

