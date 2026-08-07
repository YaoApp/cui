export interface ContentPart {
	type: 'text' | 'image_url' | 'input_audio' | 'file'
	text?: string
	image_url?: {
		url: string
		detail?: string
	}
	input_audio?: { data: string; format: string }
	file?: {
		url: string
		filename?: string
		mime_type?: string
	}
}

const AUDIO_EXTENSIONS = new Set(['wav', 'mp3', 'ogg', 'm4a', 'aac', 'flac', 'amr', 'opus', 'wma'])

export function isVoiceLike(part: ContentPart): boolean {
	if (part.type === 'input_audio') return true
	if (part.type === 'file' && part.file) {
		if (part.file.mime_type?.startsWith('audio/')) return true
		const ext = part.file.filename?.split('.').pop()?.toLowerCase()
		return ext ? AUDIO_EXTENSIONS.has(ext) : false
	}
	return false
}
