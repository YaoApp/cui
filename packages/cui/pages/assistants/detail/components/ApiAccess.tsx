import { useState, useMemo, useEffect } from 'react'
import hljsCore from 'highlight.js/lib/core'
import hljsBash from 'highlight.js/lib/languages/bash'
import hljsTs from 'highlight.js/lib/languages/typescript'
import hljsPython from 'highlight.js/lib/languages/python'
import Icon from '@/widgets/Icon'
import { App } from '@/types'
import styles from './ApiAccess.less'
import viewStyles from './View/index.less'

hljsCore.registerLanguage('bash', hljsBash)
hljsCore.registerLanguage('typescript', hljsTs)
hljsCore.registerLanguage('python', hljsPython)

type CodeLang = 'curl' | 'typescript' | 'python'

const LANG_LABELS: Record<CodeLang, string> = { curl: 'HTTP', typescript: 'TypeScript', python: 'Python' }
const HLJS_LANG: Record<CodeLang, string> = { curl: 'bash', typescript: 'typescript', python: 'python' }

function buildCode(lang: CodeLang, baseURL: string, assistantId: string): string {
	const endpoint = `${baseURL}/v1/experts/${assistantId}/chat/completions`
	switch (lang) {
		case 'curl':
			return `curl ${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $YAO_API_KEY" \\
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true,
    "metadata": {
      "chat_id": "optional-session-id",
      "locale": "zh-cn"
    }
  }'`
		case 'typescript':
			return `import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: '${baseURL}/v1/experts/${assistantId}',
  apiKey: process.env.YAO_API_KEY,
})

const stream = await client.chat.completions.create({
  model: 'default',
  messages: [{ role: 'user', content: 'Hello' }],
  stream: true,
  metadata: {
    chat_id: 'optional-session-id',
    locale: 'zh-cn',
  },
})`
		case 'python':
			return `from openai import OpenAI
import os

client = OpenAI(
    base_url="${baseURL}/v1/experts/${assistantId}",
    api_key=os.environ["YAO_API_KEY"],
)

stream = client.chat.completions.create(
    model="default",
    messages=[{"role": "user", "content": "Hello"}],
    stream=True,
    extra_body={"metadata": {
        "chat_id": "optional-session-id",
        "locale": "zh-cn",
    }},
)`
	}
}

function buildFileCode(lang: CodeLang, baseURL: string, assistantId: string): string {
	const uploadEndpoint = `${baseURL}/v1/file/__yao.attachment`
	const chatEndpoint = `${baseURL}/v1/experts/${assistantId}/chat/completions`
	switch (lang) {
		case 'curl':
			return `# Upload an image
FILE_ID=$(curl ${uploadEndpoint} \\
  -H "Authorization: Bearer $YAO_API_KEY" \\
  -F "file=@photo.png" | jq -r '.file_id')

# Send with image (Vision)
curl ${chatEndpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $YAO_API_KEY" \\
  -d '{
    "messages": [{
      "role": "user",
      "content": [
        {"type": "text", "text": "Describe this image"},
        {"type": "image_url", "image_url": {"url": "__yao.attachment://'$FILE_ID'"}}
      ]
    }],
    "stream": true
  }'

# Upload a document (markdown, PDF, etc.)
DOC_ID=$(curl ${uploadEndpoint} \\
  -H "Authorization: Bearer $YAO_API_KEY" \\
  -F "file=@notes.md" | jq -r '.file_id')

# Send with document
curl ${chatEndpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $YAO_API_KEY" \\
  -d '{
    "messages": [{
      "role": "user",
      "content": [
        {"type": "text", "text": "Summarize this document"},
        {"type": "file", "file": {"url": "__yao.attachment://'$DOC_ID'", "filename": "notes.md"}}
      ]
    }],
    "stream": true
  }'`
		case 'typescript':
			return `// Upload file
const form = new FormData()
form.append('file', fileBlob, 'photo.png')
const upload = await fetch('${uploadEndpoint}', {
  method: 'POST',
  headers: { Authorization: \`Bearer \${apiKey}\` },
  body: form,
})
const { file_id: fileId } = await upload.json()

// Image attachment (Vision)
const stream = await client.chat.completions.create({
  model: 'default',
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'Describe this image' },
      { type: 'image_url', image_url: { url: \`__yao.attachment://\${fileId}\` } },
    ],
  }],
  stream: true,
})

// Document attachment (markdown, PDF, etc.)
const stream2 = await client.chat.completions.create({
  model: 'default',
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'Summarize this document' },
      { type: 'file', file: { url: \`__yao.attachment://\${docId}\`, filename: 'notes.md' } },
    ],
  }],
  stream: true,
})`
		case 'python':
			return `import requests, os
from openai import OpenAI

client = OpenAI(
    base_url="${baseURL}/v1/experts/${assistantId}",
    api_key=os.environ["YAO_API_KEY"],
)

# Upload image
resp = requests.post(
    "${uploadEndpoint}",
    headers={"Authorization": f"Bearer {os.environ['YAO_API_KEY']}"},
    files={"file": open("photo.png", "rb")},
)
file_id = resp.json()["file_id"]

# Image attachment (Vision)
stream = client.chat.completions.create(
    model="default",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Describe this image"},
            {"type": "image_url", "image_url": {"url": f"__yao.attachment://{file_id}"}},
        ],
    }],
    stream=True,
)

# Document attachment (markdown, PDF, etc.)
doc_resp = requests.post(
    "${uploadEndpoint}",
    headers={"Authorization": f"Bearer {os.environ['YAO_API_KEY']}"},
    files={"file": open("notes.md", "rb")},
)
doc_id = doc_resp.json()["file_id"]

stream2 = client.chat.completions.create(
    model="default",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Summarize this document"},
            {"type": "file", "file": {"url": f"__yao.attachment://{doc_id}", "filename": "notes.md"}},
        ],
    }],
    stream=True,
)`
	}
}

interface ApiAccessProps {
	data: App.Assistant
	is_cn: boolean
}

function normalizeURL(url: string): string {
	try {
		const u = new URL(url)
		const host = u.hostname
		if (u.protocol === 'https:' && (host === 'localhost' || host === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(host))) {
			u.protocol = 'http:'
		}
		return u.origin
	} catch {
		return url
	}
}

const ApiAccess = ({ data, is_cn }: ApiAccessProps) => {
	const [lang, setLang] = useState<CodeLang>('curl')
	const [fileLang, setFileLang] = useState<CodeLang>('curl')
	const [copied, setCopied] = useState(false)
	const [fileCopied, setFileCopied] = useState(false)
	const [serverURL, setServerURL] = useState<string>(normalizeURL(window.location.origin))

	useEffect(() => {
		fetch('/.well-known/yao')
			.then((r) => r.json())
			.then((meta: any) => { if (meta?.server_url) setServerURL(normalizeURL(meta.server_url)) })
			.catch(() => {})
	}, [])

	const assistantId = data?.assistant_id || '<assistant_id>'
	const code = buildCode(lang, serverURL, assistantId)
	const fileCode = buildFileCode(fileLang, serverURL, assistantId)

	const highlighted = useMemo(() => {
		try { return hljsCore.highlight(code, { language: HLJS_LANG[lang] }).value } catch { return code }
	}, [code, lang])

	const fileHighlighted = useMemo(() => {
		try { return hljsCore.highlight(fileCode, { language: HLJS_LANG[fileLang] }).value } catch { return fileCode }
	}, [fileCode, fileLang])

	const handleCopy = () => {
		navigator.clipboard.writeText(code).then(() => {
			setCopied(true)
			setTimeout(() => setCopied(false), 1500)
		})
	}

	const handleFileCopy = () => {
		navigator.clipboard.writeText(fileCode).then(() => {
			setFileCopied(true)
			setTimeout(() => setFileCopied(false), 1500)
		})
	}

	return (
		<div className={styles.container}>
			<div className={viewStyles.card}>
				<div style={{ marginBottom: 16 }}>
					<div className={viewStyles.cardTitle}>{is_cn ? 'API 集成' : 'API Integration'}</div>
					<div className={viewStyles.cardDesc}>
						{is_cn
							? '通过 OpenAI 兼容的 REST API 调用此助手。'
							: 'Call this assistant via OpenAI-compatible REST API.'}
					</div>
				</div>

				{/* Lang tabs + copy */}
				<div className={styles.toolbar}>
					<div className={styles.langs}>
						{(Object.keys(LANG_LABELS) as CodeLang[]).map((l) => (
							<button
								key={l}
								className={`${styles.langBtn} ${lang === l ? styles.langBtnActive : ''}`}
								onClick={() => setLang(l)}
							>
								{LANG_LABELS[l]}
							</button>
						))}
					</div>
					<button className={styles.copyBtn} onClick={handleCopy}>
						<Icon name={copied ? 'material-check' : 'material-content_copy'} size={13} />
					</button>
				</div>

				{/* Code block */}
				<div className={styles.codeBlock}>
					<pre className={`${styles.codePre} assistant-api-code-pre`}>
						<code dangerouslySetInnerHTML={{ __html: highlighted }} />
					</pre>
				</div>

				{/* Endpoint */}
				<div className={styles.endpoint}>
					<span className={styles.endpointLabel}>Endpoint</span>
					<code className={styles.endpointValue}>
						POST {serverURL}/v1/experts/{assistantId}/chat/completions
					</code>
				</div>

				{/* Metadata parameters */}
				<div className={styles.metadataSection}>
					<div className={styles.metadataTitle}>
						{is_cn ? '自定义参数 (metadata)' : 'Custom Parameters (metadata)'}
					</div>
					<table className={styles.metadataTable}>
						<tbody>
							<tr>
								<td className={styles.metaKey}>chat_id</td>
								<td className={styles.metaDesc}>
									{is_cn
										? '会话 ID（可选，不传则自动生成）'
										: 'Session ID (optional, auto-generated if omitted)'}
								</td>
							</tr>
							<tr>
								<td className={styles.metaKey}>accept</td>
								<td className={styles.metaDesc}>
									{is_cn
										? '响应格式：standard（默认，OpenAI 兼容）| cui-web | cui-native | cui-desktop'
										: 'Response format: standard (default, OpenAI compatible) | cui-web | cui-native | cui-desktop'}
								</td>
							</tr>
							<tr>
								<td className={styles.metaKey}>locale</td>
								<td className={styles.metaDesc}>
									{is_cn ? '语言（如 zh-cn、en-us）' : 'Language (e.g. zh-cn, en-us)'}
								</td>
							</tr>
							<tr>
								<td className={styles.metaKey}>route</td>
								<td className={styles.metaDesc}>
									{is_cn ? 'CUI 路由上下文' : 'CUI route context'}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			{/* File Upload Section */}
			<div className={viewStyles.card} style={{ marginTop: 20 }}>
				<div style={{ marginBottom: 16 }}>
					<div className={viewStyles.cardTitle}>{is_cn ? '文件上传' : 'File Upload'}</div>
					<div className={viewStyles.cardDesc}>
						{is_cn
							? '上传文件后在消息中引用，支持图片（Vision）和文档。'
							: 'Upload files and reference them in messages. Supports images (Vision) and documents.'}
					</div>
				</div>

				{/* File lang tabs + copy */}
				<div className={styles.toolbar}>
					<div className={styles.langs}>
						{(Object.keys(LANG_LABELS) as CodeLang[]).map((l) => (
							<button
								key={l}
								className={`${styles.langBtn} ${fileLang === l ? styles.langBtnActive : ''}`}
								onClick={() => setFileLang(l)}
							>
								{LANG_LABELS[l]}
							</button>
						))}
					</div>
					<button className={styles.copyBtn} onClick={handleFileCopy}>
						<Icon name={fileCopied ? 'material-check' : 'material-content_copy'} size={13} />
					</button>
				</div>

				{/* File code block */}
				<div className={styles.codeBlock}>
					<pre className={`${styles.codePre} assistant-api-code-pre`}>
						<code dangerouslySetInnerHTML={{ __html: fileHighlighted }} />
					</pre>
				</div>

				{/* File upload endpoint */}
				<div className={styles.endpoint}>
					<span className={styles.endpointLabel}>Upload</span>
					<code className={styles.endpointValue}>
						POST {serverURL}/v1/file/__yao.attachment
					</code>
				</div>

				{/* Attachment reference formats */}
				<div className={styles.metadataSection}>
					<div className={styles.metadataTitle}>
						{is_cn ? '附件引用格式' : 'Attachment Reference Formats'}
					</div>
					<table className={styles.metadataTable}>
						<tbody>
							<tr>
								<td className={styles.metaKey}>image_url</td>
								<td className={styles.metaDesc}>
									{is_cn ? '图片（支持 Vision）' : 'Image (Vision supported)'}
									<code className={styles.metaCode}>
										{`{"type": "image_url", "image_url": {"url": "__yao.attachment://{file_id}"}}`}
									</code>
								</td>
							</tr>
							<tr>
								<td className={styles.metaKey}>file</td>
								<td className={styles.metaDesc}>
									{is_cn ? '文档（markdown, PDF, txt 等）' : 'Document (markdown, PDF, txt, etc.)'}
									<code className={styles.metaCode}>
										{`{"type": "file", "file": {"url": "__yao.attachment://{file_id}", "filename": "..."}}`}
									</code>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}

export default ApiAccess
