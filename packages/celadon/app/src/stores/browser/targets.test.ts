import { describe, expect, it } from 'vitest'
import { parseTarget, sameTarget, targetLabel } from './targets'

describe('目标解析', () => {
	it('空串是新标签页', () => {
		expect(parseTarget('')).toEqual({ kind: 'blank' })
		expect(parseTarget('   ')).toEqual({ kind: 'blank' })
	})

	it('斜杠开头是内部路由', () => {
		expect(parseTarget('/help')).toEqual({ kind: 'internal', path: '/help' })
		expect(parseTarget('/workspace/yao')).toEqual({ kind: 'internal', path: '/workspace/yao' })
	})

	it('已知名字是快捷方式，可以带一个参数', () => {
		expect(parseTarget('help')).toEqual({ kind: 'shortcut', name: 'help', path: '/help', param: undefined })
		expect(parseTarget('WORKSPACE:yao')).toEqual({
			kind: 'shortcut',
			name: 'workspace',
			path: '/workspace/yao',
			param: 'yao'
		})
		expect(parseTarget('home')).toEqual({ kind: 'shortcut', name: 'home', path: '/', param: undefined })
	})

	it('其余按外部网址，连协议与端口都原样留着', () => {
		expect(parseTarget('example.com')).toEqual({ kind: 'external', url: 'example.com' })
		expect(parseTarget('https://example.com/a?b=1')).toEqual({
			kind: 'external',
			url: 'https://example.com/a?b=1'
		})
		expect(parseTarget('http:8080')).toEqual({ kind: 'external', url: 'http:8080' })
	})

	it('同一页的比较按目标本身，不看页的 key', () => {
		expect(sameTarget({ kind: 'external', url: 'a' }, { kind: 'external', url: 'a' })).toBe(true)
		expect(sameTarget({ kind: 'external', url: 'a' }, { kind: 'external', url: 'b' })).toBe(false)
		expect(sameTarget({ kind: 'internal', path: '/a' }, { kind: 'external', url: '/a' })).toBe(false)
		expect(
			sameTarget(
				{ kind: 'shortcut', name: 'workspace', path: '/workspace/yao', param: 'yao' },
				{ kind: 'shortcut', name: 'workspace', path: '/workspace/other', param: 'other' }
			)
		).toBe(false)
	})

	it('标签名按目标给：外部用地址，内部与快捷方式用路径', () => {
		expect(targetLabel({ kind: 'external', url: 'example.com' })).toBe('example.com')
		expect(targetLabel({ kind: 'internal', path: '/help' })).toBe('/help')
		expect(targetLabel({ kind: 'shortcut', name: 'workspace', path: '/workspace/yao' })).toBe('/workspace/yao')
	})
})
