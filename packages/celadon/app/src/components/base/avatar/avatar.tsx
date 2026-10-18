import './avatar.less'
import { useEffect, useState } from 'react'

export type AvatarSize = 24 | 32 | 64

export type AvatarTeam = {
  /** 团队名，只取首字做徽标 */
  name: string
}

export type AvatarProps = {
  /** 显示名；为空时回退 `U` */
  name?: string
  /** 头像图片地址；加载失败自动回退首字母 */
  src?: string
  size?: AvatarSize
  /** 团队账号才传；右下角叠一个团队徽标 */
  team?: AvatarTeam
  /** 首次加载资料时的骨架 */
  loading?: boolean
  /** 有含义时传（资料页），纯装饰不传 */
  label?: string
  className?: string
}

const initialOf = (name?: string): string => {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return 'U'
  return Array.from(trimmed)[0].toUpperCase()
}

function classNames(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** 头像：图片优先，没有图片或加载失败时用名字首字母；团队账号在右下叠团队徽标。
    只负责展示，不认识账号与团队的业务数据（见 `architecture/03-boundaries.md`）。 */
export function Avatar({ name, src, size = 32, team, loading = false, label, className }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  /* 换了一个头像地址就重新尝试；失败只针对当前这一张图 */
  useEffect(() => setFailed(false), [src])
  const showImage = Boolean(src) && !failed

  if (loading) {
    return (
      <span
        className={classNames('avatar', 'avatar--loading', className)}
        data-size={size}
        aria-hidden={label ? undefined : true}
        aria-label={label}
        role={label ? 'img' : undefined}
      />
    )
  }

  return (
    <span
      className={classNames('avatar', className)}
      data-size={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {showImage ? (
        <img className='avatar__image' src={src} alt='' onError={() => setFailed(true)} />
      ) : (
        <span className='avatar__initial' aria-hidden='true'>
          {initialOf(name)}
        </span>
      )}
      {team ? (
        <span className='avatar__team' aria-hidden='true'>
          {initialOf(team.name)}
        </span>
      ) : null}
    </span>
  )
}
