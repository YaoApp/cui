export interface GeneratorProps {
	/** Avatar agent ID */
	avatarAgent: string
	/** Generate success callback */
	onSuccess: (fileId: string, fileUrl: string) => void
	/** Image generate callback to notify parent about image generation state */
	onImageGenerate?: (hasImage: boolean) => void
}
