import React, { useState } from 'react'
import clsx from 'clsx'
import { Icon } from '@/widgets'
import styles from './DiffView.less'

interface FilePatch {
	path: string
	status: string
	patch: string
	additions: number
	deletions: number
}

interface DiffViewProps {
	patches: FilePatch[]
}

const DiffView = ({ patches }: DiffViewProps) => {
	return (
		<div className={styles.diffContainer}>
			{patches.map((fp, idx) => (
				<FileBlock key={fp.path + idx} patch={fp} />
			))}
		</div>
	)
}

const FileBlock = ({ patch }: { patch: FilePatch }) => {
	const [expanded, setExpanded] = useState(true)
	const fileName = patch.path.split(/[/\\]/).pop() || patch.path

	return (
		<div className={styles.fileBlock}>
			<div className={styles.fileHeader} onClick={() => setExpanded(!expanded)}>
				<span className={clsx(styles.chevron, expanded && styles.chevronExpanded)}>
					<Icon name='icon-chevron-right' size={10} />
				</span>
				<span className={styles.fileName} title={patch.path}>
					{fileName}
				</span>
				{patch.status === 'created' && (
					<span className={styles.statusBadge}>new</span>
				)}
				<span className={styles.stats}>
					{patch.additions > 0 && (
						<span className={styles.statAdd}>+{patch.additions}</span>
					)}
					{patch.deletions > 0 && (
						<span className={styles.statDel}>-{patch.deletions}</span>
					)}
				</span>
			</div>
			{expanded && patch.patch && (
				<pre className={styles.patchBody}>
					{patch.patch.split('\n').map((line, i) => (
						<span key={i} className={clsx(styles.diffLine, classForLine(line))}>
							{line}
							{'\n'}
						</span>
					))}
				</pre>
			)}
		</div>
	)
}

function classForLine(line: string): string | undefined {
	if (line.startsWith('@@')) return styles.diffHunk
	if (line.startsWith('+')) return styles.diffAdd
	if (line.startsWith('-')) return styles.diffDel
	return undefined
}

export default DiffView
