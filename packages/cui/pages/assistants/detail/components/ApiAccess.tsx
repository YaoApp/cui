import { useState, useMemo, useEffect } from 'react'
import hljsCore from 'highlight.js/lib/core'
import hljsBash from 'highlight.js/lib/languages/bash'
import hljsTs from 'highlight.js/lib/languages/typescript'
import hljsPython from 'highlight.js/lib/languages/python'
import Icon from '@/widgets/Icon'
import { App } from '@/types'
import styles from './ApiAccess.less'

hljsCore.registerLanguage('bash', hljsBash)
hljsCore.registerLanguage('typescript', hljsTs)
hljsCore.registerLanguage('python', hljsPython)

type CodeLang = 'curl' | 'typescript' | 'python'

const LANG_LABELS: Record<CodeLang, string> = { curl: 'HTTP', typescript: 'TypeScript', python: 'Python' }
const HLJS_LANG: Record<CodeLang, string> = { curl: 'bash', typescript: 'typescript', python: 'python' }

function buildCode(lang: CodeLang, baseURL: string, assistantId: string): string {
	const endpoint = `${baseURL}/v1/chat/${assistantId}/completions`
	switch (lang) {
		case 'curl':
			return `curl ${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $YAO_API_KEY" \\
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'`
		case 'typescript':
			return `import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: '${baseURL}/v1/chat/${assistantId}',
  apiKey: process.env.YAO_API_KEY,
})

const stream = await client.chat.completions.create({
  model: 'default',
  messages: [{ role: 'user', content: 'Hello' }],
  stream: true,
})`
		case 'python':
			return `from openai import OpenAI
import os

client = OpenAI(
    base_url="${baseURL}/v1/chat/${assistantId}",
    api_key=os.environ["YAO_API_KEY"],
)

stream = client.chat.completions.create(
    model="default",
    messages=[{"role": "user", "content": "Hello"}],
    stream=True,
)`
	}
}

interface ApiAccessProps {
	data: App.Assistant
	is_cn: boolean
}

const ApiAccess = ({ data, is_cn }: ApiAccessProps) => {
	const [lang, setLang] = useState<CodeLang>('curl')
	const [copied, setCopied] = useState(false)
	const [serverURL, setServerURL] = useState<string>(window.location.origin)

	useEffect(() => {
		fetch('/.well-known/yao')
			.then((r) => r.json())
			.then((meta: any) => { if (meta?.server_url) setServerURL(meta.server_url) })
			.catch(() => {})
	}, [])

	const assistantId = data?.assistant_id || '<assistant_id>'
	const code = buildCode(lang, serverURL, assistantId)

	const highlighted = useMemo(() => {
		try { return hljsCore.highlight(code, { language: HLJS_LANG[lang] }).value } catch { return code }
	}, [code, lang])

	const handleCopy = () => {
		navigator.clipboard.writeText(code).then(() => {
			setCopied(true)
			setTimeout(() => setCopied(false), 1500)
		})
	}

	return (
		<div className={styles.container}>
			{/* Title */}
			<div className={styles.title}>
				{is_cn ? 'Chat 对话' : 'Chat Completions'}
			</div>
			<div className={styles.hint}>
				{is_cn
					? '与该助手对话。兼容 OpenAI Chat Completion 协议，支持流式输出'
					: 'Chat with this assistant. OpenAI-compatible, streaming supported'}
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
					POST {serverURL}/v1/chat/{assistantId}/completions
				</code>
			</div>
		</div>
	)
}

export default ApiAccess
