import { useState, useMemo, useEffect } from 'react'
import hljsCore from 'highlight.js/lib/core'
import hljsBash from 'highlight.js/lib/languages/bash'
import hljsTs from 'highlight.js/lib/languages/typescript'
import hljsPython from 'highlight.js/lib/languages/python'
import Icon from '@/widgets/Icon'
import apiStyles from '@/pages/assistants/detail/components/ApiAccess.less'
import viewStyles from '@/pages/assistants/detail/components/View/index.less'

hljsCore.registerLanguage('bash', hljsBash)
hljsCore.registerLanguage('typescript', hljsTs)
hljsCore.registerLanguage('python', hljsPython)

type CodeLang = 'shell' | 'typescript' | 'python'

const LANG_LABELS: Record<CodeLang, string> = { shell: 'Shell', typescript: 'TypeScript', python: 'Python' }
const HLJS_LANG: Record<CodeLang, string> = { shell: 'bash', typescript: 'typescript', python: 'python' }

function normalizeURL(url: string): string {
	try {
		const u = new URL(url)
		if (u.protocol === 'https:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname))) {
			u.protocol = 'http:'
		}
		return u.origin
	} catch {
		return url
	}
}

function toWsURL(httpURL: string): string {
	return httpURL.replace(/^http/, 'ws')
}

function buildWSCode(lang: CodeLang, baseURL: string, chatId: string): string {
	const wsURL = toWsURL(baseURL)
	const wsEndpoint = `${wsURL}/v1/agent/tasks/${chatId}/ws`

	switch (lang) {
		case 'shell':
			return `# Install: npm install -g wscat
wscat -c "${wsEndpoint}" \\
  -H "Authorization: Bearer $YAO_API_KEY"

# After connected, send a run command:
{"type":"run","messages":[{"role":"user","content":"Hello"}]}

# Read history:
{"type":"read","since":0}

# Stop execution:
{"type":"stop"}`

		case 'typescript':
			return `import WebSocket from 'ws'

const ws = new WebSocket(
  '${wsEndpoint}',
  { headers: { Authorization: \`Bearer \${process.env.YAO_API_KEY}\` } }
)

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'run',
    messages: [{ role: 'user', content: 'Hello' }],
  }))
})

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString())
  console.log(msg)
})`

		case 'python':
			return `import asyncio, json, os
import websockets

async def main():
    uri = "${wsEndpoint}"
    headers = {"Authorization": f"Bearer {os.environ['YAO_API_KEY']}"}

    async with websockets.connect(uri, extra_headers=headers) as ws:
        await ws.send(json.dumps({
            "type": "run",
            "messages": [{"role": "user", "content": "Hello"}],
        }))

        async for msg in ws:
            print(json.loads(msg))

asyncio.run(main())`
	}
}

function buildSSECode(lang: CodeLang, baseURL: string, chatId: string): string {
	const endpoint = `${baseURL}/v1/agent/tasks/${chatId}/stream?since=0`

	switch (lang) {
		case 'shell':
			return `curl -N "${endpoint}" \\
  -H "Authorization: Bearer $YAO_API_KEY" \\
  -H "Accept: text/event-stream"`

		case 'typescript':
			return `const res = await fetch(
  '${endpoint}',
  { headers: { Authorization: \`Bearer \${process.env.YAO_API_KEY}\` } }
)

const reader = res.body!.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  console.log(decoder.decode(value))
}`

		case 'python':
			return `import requests, os

res = requests.get(
    "${endpoint}",
    headers={"Authorization": f"Bearer {os.environ['YAO_API_KEY']}"},
    stream=True,
)

for line in res.iter_lines():
    if line:
        print(line.decode())`
	}
}

function buildRESTCode(lang: CodeLang, baseURL: string, chatId: string): string {
	const runEndpoint = `${baseURL}/v1/agent/tasks/${chatId}/run`

	switch (lang) {
		case 'shell':
			return `# Start execution
curl -X POST ${runEndpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $YAO_API_KEY" \\
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Stop execution
curl -X POST ${baseURL}/v1/agent/tasks/${chatId}/stop \\
  -H "Authorization: Bearer $YAO_API_KEY"

# Send input (while waiting)
curl -X POST ${baseURL}/v1/agent/tasks/${chatId}/input \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $YAO_API_KEY" \\
  -d '{"content":"user response"}'`

		case 'typescript':
			return `const apiKey = process.env.YAO_API_KEY
const headers = {
  'Content-Type': 'application/json',
  Authorization: \`Bearer \${apiKey}\`,
}

// Start execution
const run = await fetch('${runEndpoint}', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello' }],
  }),
})
console.log(await run.json())

// Stop execution
await fetch('${baseURL}/v1/agent/tasks/${chatId}/stop', {
  method: 'POST',
  headers,
})`

		case 'python':
			return `import requests, os

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {os.environ['YAO_API_KEY']}",
}

# Start execution
res = requests.post(
    "${runEndpoint}",
    headers=headers,
    json={"messages": [{"role": "user", "content": "Hello"}]},
)
print(res.json())

# Stop execution
requests.post(
    "${baseURL}/v1/agent/tasks/${chatId}/stop",
    headers=headers,
)`
	}
}

function buildFileCode(lang: CodeLang, baseURL: string, chatId: string): string {
	const uploadEndpoint = `${baseURL}/v1/file/__yao.attachment`
	const runEndpoint = `${baseURL}/v1/agent/tasks/${chatId}/run`

	switch (lang) {
		case 'shell':
			return `# Upload a file
FILE_ID=$(curl ${uploadEndpoint} \\
  -H "Authorization: Bearer $YAO_API_KEY" \\
  -F "file=@photo.png" | jq -r '.file_id')

# Run task with the uploaded file
curl -X POST ${runEndpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $YAO_API_KEY" \\
  -d '{
    "messages": [{
      "role": "user",
      "content": [
        {"type": "text", "text": "Analyze this image"},
        {"type": "image_url", "image_url": {"url": "__yao.attachment://'$FILE_ID'"}}
      ]
    }]
  }'`

		case 'typescript':
			return `const apiKey = process.env.YAO_API_KEY

// Upload file
const form = new FormData()
form.append('file', fileBlob, 'photo.png')
const upload = await fetch('${uploadEndpoint}', {
  method: 'POST',
  headers: { Authorization: \`Bearer \${apiKey}\` },
  body: form,
})
const { file_id: fileId } = await upload.json()

// Run task with file via WebSocket
ws.send(JSON.stringify({
  type: 'run',
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'Analyze this image' },
      { type: 'image_url', image_url: { url: \`__yao.attachment://\${fileId}\` } },
    ],
  }],
}))`

		case 'python':
			return `import requests, os

api_key = os.environ["YAO_API_KEY"]
headers = {"Authorization": f"Bearer {api_key}"}

# Upload file
resp = requests.post(
    "${uploadEndpoint}",
    headers=headers,
    files={"file": open("photo.png", "rb")},
)
file_id = resp.json()["file_id"]

# Run task with file
requests.post(
    "${runEndpoint}",
    headers={**headers, "Content-Type": "application/json"},
    json={"messages": [{
        "role": "user",
        "content": [
            {"type": "text", "text": "Analyze this image"},
            {"type": "image_url", "image_url": {"url": f"__yao.attachment://{file_id}"}},
        ],
    }]},
)`
	}
}

interface CodeBlockProps {
	title: string
	description: string
	buildCode: (lang: CodeLang, baseURL: string, chatId: string) => string
	serverURL: string
	chatId: string
	is_cn: boolean
}

const CodeBlock = ({ title, description, buildCode, serverURL, chatId, is_cn }: CodeBlockProps) => {
	const [lang, setLang] = useState<CodeLang>('shell')
	const [copied, setCopied] = useState(false)

	const code = buildCode(lang, serverURL, chatId)
	const highlighted = useMemo(() => {
		try { return hljsCore.highlight(code, { language: HLJS_LANG[lang] }).value } catch { return code }
	}, [code, lang])

	const handleCopy = () => {
		const doCopy = navigator.clipboard?.writeText
			? navigator.clipboard.writeText(code)
			: new Promise<void>((resolve, reject) => {
				try {
					const ta = document.createElement('textarea')
					ta.value = code
					ta.style.position = 'fixed'
					ta.style.opacity = '0'
					document.body.appendChild(ta)
					ta.select()
					document.execCommand('copy')
					document.body.removeChild(ta)
					resolve()
				} catch (e) { reject(e) }
			})
		doCopy.then(() => {
			setCopied(true)
			setTimeout(() => setCopied(false), 1500)
		}).catch(() => {})
	}

	return (
		<div className={viewStyles.card}>
			<div style={{ marginBottom: 16 }}>
				<div className={viewStyles.cardTitle}>{title}</div>
				<div className={viewStyles.cardDesc}>{description}</div>
			</div>

			<div className={apiStyles.toolbar}>
				<div className={apiStyles.langs}>
					{(Object.keys(LANG_LABELS) as CodeLang[]).map((l) => (
						<button
							key={l}
							className={`${apiStyles.langBtn} ${lang === l ? apiStyles.langBtnActive : ''}`}
							onClick={() => setLang(l)}
						>
							{LANG_LABELS[l]}
						</button>
					))}
				</div>
				<button className={apiStyles.copyBtn} onClick={handleCopy}>
					<Icon name={copied ? 'material-check' : 'material-content_copy'} size={13} />
				</button>
			</div>

			<div className={apiStyles.codeBlock}>
				<pre className={`${apiStyles.codePre} assistant-api-code-pre`}>
					<code dangerouslySetInnerHTML={{ __html: highlighted }} />
				</pre>
			</div>
		</div>
	)
}

interface TaskApiAccessProps {
	taskId: string
	task: any
	is_cn: boolean
}

const TaskApiAccess = ({ taskId, is_cn }: TaskApiAccessProps) => {
	const [serverURL, setServerURL] = useState<string>(normalizeURL(window.location.origin))
	const chatId = taskId || '<chat_id>'

	useEffect(() => {
		fetch('/.well-known/yao')
			.then((r) => r.json())
			.then((meta: any) => { if (meta?.server_url) setServerURL(normalizeURL(meta.server_url)) })
			.catch(() => {})
	}, [])

	const wsEndpoint = `${toWsURL(serverURL)}/v1/agent/tasks/${chatId}/ws`
	const sseEndpoint = `${serverURL}/v1/agent/tasks/${chatId}/stream?since=0`

	return (
		<div className={apiStyles.container}>
			<CodeBlock
				title={is_cn ? 'WebSocket 连接' : 'WebSocket Connection'}
				description={is_cn
					? '通过 WebSocket 实时双向通信，执行任务并接收流式输出。'
					: 'Real-time bidirectional communication via WebSocket for task execution and streaming output.'}
				buildCode={buildWSCode}
				serverURL={serverURL}
				chatId={chatId}
				is_cn={is_cn}
			/>

			<div className={apiStyles.endpoint}>
				<span className={apiStyles.endpointLabel}>WS</span>
				<code className={apiStyles.endpointValue}>{wsEndpoint}</code>
			</div>

			<div className={apiStyles.metadataSection}>
				<div className={apiStyles.metadataTitle}>
					{is_cn ? 'WebSocket 命令类型' : 'WebSocket Command Types'}
				</div>
				<table className={apiStyles.metadataTable}>
					<tbody>
						<tr>
							<td className={apiStyles.metaKey}>run</td>
							<td className={apiStyles.metaDesc}>
								{is_cn ? '执行任务（需包含 messages 数组）' : 'Execute task (requires messages array)'}
							</td>
						</tr>
						<tr>
							<td className={apiStyles.metaKey}>read</td>
							<td className={apiStyles.metaDesc}>
								{is_cn ? '读取消息历史（可选 since / limit 参数）' : 'Read message history (optional since / limit params)'}
							</td>
						</tr>
						<tr>
							<td className={apiStyles.metaKey}>history</td>
							<td className={apiStyles.metaDesc}>
								{is_cn ? '加载更多历史消息（向上翻页）' : 'Load more history (scroll up)'}
							</td>
						</tr>
						<tr>
							<td className={apiStyles.metaKey}>retry</td>
							<td className={apiStyles.metaDesc}>
								{is_cn ? '重试上次执行' : 'Retry last execution'}
							</td>
						</tr>
						<tr>
							<td className={apiStyles.metaKey}>stop</td>
							<td className={apiStyles.metaDesc}>
								{is_cn ? '优雅停止执行' : 'Gracefully stop execution'}
							</td>
						</tr>
						<tr>
							<td className={apiStyles.metaKey}>cancel</td>
							<td className={apiStyles.metaDesc}>
								{is_cn ? '强制取消执行' : 'Force cancel execution'}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div style={{ marginTop: 20 }}>
				<CodeBlock
					title={is_cn ? 'SSE 流式订阅' : 'SSE Stream'}
					description={is_cn
						? '通过 Server-Sent Events 单向接收任务输出，适用于不支持 WebSocket 的环境。'
						: 'Receive task output via Server-Sent Events. Use when WebSocket is not available.'}
					buildCode={buildSSECode}
					serverURL={serverURL}
					chatId={chatId}
					is_cn={is_cn}
				/>
			</div>

			<div className={apiStyles.endpoint}>
				<span className={apiStyles.endpointLabel}>SSE</span>
				<code className={apiStyles.endpointValue}>{sseEndpoint}</code>
			</div>

			<div style={{ marginTop: 20 }}>
				<CodeBlock
					title={is_cn ? 'REST 控制端点' : 'REST Control Endpoints'}
					description={is_cn
						? '通过 REST API 启动、停止任务或发送输入。'
						: 'Start, stop tasks or send input via REST API.'}
					buildCode={buildRESTCode}
					serverURL={serverURL}
					chatId={chatId}
					is_cn={is_cn}
				/>
			</div>

			<div className={apiStyles.metadataSection}>
				<div className={apiStyles.metadataTitle}>
					{is_cn ? '控制端点' : 'Control Endpoints'}
				</div>
				<table className={apiStyles.metadataTable}>
					<tbody>
						<tr>
							<td className={apiStyles.metaKey}>POST .../run</td>
							<td className={apiStyles.metaDesc}>
								{is_cn ? '启动任务执行' : 'Start task execution'}
							</td>
						</tr>
						<tr>
							<td className={apiStyles.metaKey}>POST .../stop</td>
							<td className={apiStyles.metaDesc}>
								{is_cn ? '停止执行（?force=true 强制停止）' : 'Stop execution (?force=true for force stop)'}
							</td>
						</tr>
						<tr>
							<td className={apiStyles.metaKey}>POST .../input</td>
							<td className={apiStyles.metaDesc}>
								{is_cn ? '任务等待输入时发送用户响应' : 'Send user response when task is waiting for input'}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div style={{ marginTop: 20 }}>
				<CodeBlock
					title={is_cn ? '文件上传' : 'File Upload'}
					description={is_cn
						? '上传文件后在消息中引用，支持图片（Vision）和文档。'
						: 'Upload files and reference them in messages. Supports images (Vision) and documents.'}
					buildCode={buildFileCode}
					serverURL={serverURL}
					chatId={chatId}
					is_cn={is_cn}
				/>
			</div>

			<div className={apiStyles.endpoint}>
				<span className={apiStyles.endpointLabel}>Upload</span>
				<code className={apiStyles.endpointValue}>
					POST {serverURL}/v1/file/__yao.attachment
				</code>
			</div>

			<div className={apiStyles.metadataSection}>
				<div className={apiStyles.metadataTitle}>
					{is_cn ? '附件引用格式' : 'Attachment Reference Formats'}
				</div>
				<table className={apiStyles.metadataTable}>
					<tbody>
						<tr>
							<td className={apiStyles.metaKey}>image_url</td>
							<td className={apiStyles.metaDesc}>
								{is_cn ? '图片（支持 Vision）' : 'Image (Vision supported)'}
								<code className={apiStyles.metaCode}>
									{`{"type": "image_url", "image_url": {"url": "__yao.attachment://{file_id}"}}`}
								</code>
							</td>
						</tr>
						<tr>
							<td className={apiStyles.metaKey}>file</td>
							<td className={apiStyles.metaDesc}>
								{is_cn ? '文档（markdown, PDF, txt 等）' : 'Document (markdown, PDF, txt, etc.)'}
								<code className={apiStyles.metaCode}>
									{`{"type": "file", "file": {"url": "__yao.attachment://{file_id}", "filename": "..."}}`}
								</code>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default TaskApiAccess
