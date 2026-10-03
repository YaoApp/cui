/* 解析不到就跳过：不存在的别名路径与第三方包都不该报（见检查器注释）。 */
import { Ghost } from '@/features/ghost'
import { Nope } from 'some-third-party-package'

export const optional = [Ghost, Nope]
