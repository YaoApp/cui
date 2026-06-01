import fs from 'fs'
import moment from 'moment'
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'

import type Config from 'webpack-chain'
import type { JscConfig } from '@swc/core'

const packagejson = JSON.parse(fs.readFileSync(`${process.cwd()}/package.json`).toString())
const version = packagejson.version

export const env = process.env.NODE_ENV as 'development' | 'production'

export const base = `/${process.env.BASE}/`

// SSE代理配置函数，支持流式传输
const createSSEProxy = (target: string) => ({
	target,
	changeOrigin: true,
	ws: true,
	onProxyRes: (proxyRes: any, req: any, res: any) => {
		// 禁用代理响应缓冲，实现SSE流式传输
		if (req.headers.accept?.includes('text/event-stream')) {
			proxyRes.headers['Cache-Control'] = 'no-cache, no-transform'
			proxyRes.headers['Connection'] = 'keep-alive'
			proxyRes.headers['X-Accel-Buffering'] = 'no'
		}
	}
})

const yaoServerHost = 'http://yao-dev-server:5099'
export const proxy = {
	'/v1': createSSEProxy(yaoServerHost),
	'/api': createSSEProxy(yaoServerHost),
	'/components': { target: yaoServerHost, changeOrigin: true },
	'/assets': { target: yaoServerHost, changeOrigin: true },
	'/iframe': { target: yaoServerHost, changeOrigin: true },
	'/.well-known': { target: yaoServerHost, changeOrigin: true },
	'/ai': { target: yaoServerHost, changeOrigin: true },
	'/agents': { target: yaoServerHost, changeOrigin: true },
	'/docs': { target: yaoServerHost, changeOrigin: true },
	'/tools': { target: yaoServerHost, changeOrigin: true },
	'/brands': { target: yaoServerHost, changeOrigin: true },
	'/admin': { target: yaoServerHost, changeOrigin: true }
}

export const conventionRoutes = {
	exclude: [
		/model\.(j|t)sx?$/,
		/services\.(j|t)sx?$/,
		/types\.(j|t)sx?$/,
		/hooks\.(j|t)sx?$/,
		/locales\.(j|t)sx?$/,
		/components\//,
		/model\//,
		/types\//,
		/hooks\//,
		/locales\//,
		/_(.*)$/
	]
}

export const metas = [{ name: 'Built Info', content: `time:${moment().format()}` + `|version:${version}` }]

export const links = [
	{ rel: 'preload', href: `/${process.env.BASE}/icon_font.css`, as: 'style' },
	{ rel: 'preload', href: `/${process.env.BASE}/theme/light.css`, as: 'style' },
	{ rel: 'stylesheet', href: `/${process.env.BASE}/icon_font.css`, as: 'style' },
	{ rel: 'stylesheet', href: `/${process.env.BASE}/theme/light.css`, as: 'style' }
]

export const chainWebpack = (config: Config, _: any) => {
	const reg_shadowcss = /\.sss$/
	const reg_shadowless = /\.lsss$/

	config.module.rule('asset').exclude.add(reg_shadowcss).end().exclude.add(reg_shadowless).end()
	config.plugin('monaco-editor-webpack-plugin').use(MonacoWebpackPlugin, [
		{ languages: ['json', 'javascript', 'typescript', 'yaml', 'html', 'css', 'sql', 'markdown'] }
	])

	config.module
		.rule('shadowcss')
		.test(reg_shadowcss)
		.exclude.add(/node_modules/)
		.end()
		.use('raw-loader')
		.loader('raw-loader')
		.end()

	config.module
		.rule('shadowless')
		.test(reg_shadowless)
		.exclude.add(/node_modules/)
		.end()
		.use('raw-loader')
		.loader('raw-loader')
		.end()
		.use('less-loader')
		.loader('less-loader')
		.end()
}

const sp_jsc_config = process.platform === 'win32' && process.env.NODE_ENV === 'development' ? { target: 'es2022' } : {}

export const srcTranspilerOptions = {
	swc: {
		jsc: Object.assign(
			{
				parser: { syntax: 'typescript', tsx: true, decorators: true, topLevelAwait: true },
				transform: { legacyDecorator: true, decoratorMetadata: true }
			} as JscConfig,
			sp_jsc_config
		)
	}
}
