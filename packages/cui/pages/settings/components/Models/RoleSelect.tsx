import { useMemo } from 'react'
import { getLocale } from '@umijs/max'
import { Select } from '@/components/ui/inputs'
import type { PropertySchema, OptionGroup, EnumOption } from '@/components/ui/inputs/types'
import type { ProviderConfig, ModelRole, ModelCapability } from '../../types'

const ROLE_FILTER: Record<ModelRole, ModelCapability | null> = {
	default: null,
	vision: 'vision',
	audio: 'audio',
	embedding: 'embedding'
}

const CAP_SHORT: Record<string, { cn: string; en: string }> = {
	vision: { cn: '看图', en: 'Vision' },
	audio: { cn: '语音', en: 'Audio' },
	reasoning: { cn: '思考', en: 'Reasoning' }
}

function capDesc(caps: ModelCapability[], is_cn: boolean): string {
	return caps
		.filter((c) => CAP_SHORT[c])
		.map((c) => (is_cn ? CAP_SHORT[c].cn : CAP_SHORT[c].en))
		.join(' · ')
}

interface RoleSelectProps {
	role: ModelRole
	value?: string
	onChange: (val: string | undefined) => void
	providers: ProviderConfig[]
}

export default function RoleSelect({ role, value, onChange, providers }: RoleSelectProps) {
	const is_cn = getLocale() === 'zh-CN'
	const requiredCap = ROLE_FILTER[role]

	const schema = useMemo((): PropertySchema => {
		const groups: OptionGroup[] = []

		for (const p of providers) {
			if (!p.enabled) continue
			const enabledModels = p.models.filter((m) => m.enabled)
			const filtered = requiredCap
				? enabledModels.filter((m) => m.capabilities.includes(requiredCap))
				: enabledModels.filter((m) => !m.capabilities.includes('embedding'))

			if (filtered.length === 0) continue

			const opts: EnumOption[] = filtered.map((m) => ({
				label: `${p.name} / ${m.name}`,
				value: `${p.key}::${m.id}`,
				description: capDesc(m.capabilities, is_cn)
			}))

			groups.push({ groupLabel: p.name, options: opts })
		}

		const isOptional = role !== 'default'
		const disableRoles: ModelRole[] = ['audio', 'embedding']
		const isDisableType = disableRoles.includes(role)
		const placeholder = isOptional
			? is_cn
				? isDisableType
					? '不选择（关闭该功能）'
					: '不选择（跟随默认）'
				: isDisableType
					? 'None (disable feature)'
					: 'None (follow default)'
			: is_cn
				? '请选择模型'
				: 'Select a model'

		return {
			type: 'string',
			enum: groups,
			placeholder,
			searchable: true,
			allowClear: isOptional
		}
	}, [providers, role, requiredCap, is_cn])

	return (
		<Select
			schema={schema}
			value={value}
			onChange={(v) => onChange(v ? String(v) : undefined)}
			allowClear={role !== 'default'}
		/>
	)
}
