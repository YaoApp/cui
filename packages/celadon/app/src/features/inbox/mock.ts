import type { I18nKey } from '@/platform/i18n/i18n-types'

/** 一列会话。内容是演示数据，文案走语言包（`architecture/08-i18n.md`）。 */
export type InboxSession = {
  id: string
  titleKey: I18nKey
  summaryKey: I18nKey
  /** 未读数；0 与缺省都不画角标 */
  unread?: number
  /** 这一条在会话里的状态 */
  statusKey?: I18nKey
}

/** 一条消息。 */
export type InboxMessage = {
  id: string
  /** `me` 是用户自己发的，`agent` 是对方 */
  from: 'me' | 'agent'
  bodyKey: I18nKey
}

/** 会话里被引用的东西，四类：应用、文件、仓库、消息。 */
export type InboxReference = {
  id: string
  kind: 'app' | 'file' | 'repo'
  labelKey: I18nKey
}

/* 收件箱的演示数据：把设计里的会话形态摆出来（`design/main-shell.md` §二 与场景一），
   真实数据随后接接口。 */
export const INBOX_SESSIONS: InboxSession[] = [
  {
    id: 'contract',
    titleKey: 'inbox.session.contract.title',
    summaryKey: 'inbox.session.contract.summary',
    unread: 3,
    statusKey: 'inbox.status.waiting',
  },
  {
    id: 'materials',
    titleKey: 'inbox.session.materials.title',
    summaryKey: 'inbox.session.materials.summary',
  },
  {
    id: 'release',
    titleKey: 'inbox.session.release.title',
    summaryKey: 'inbox.session.release.summary',
  },
]

export const INBOX_MESSAGES: InboxMessage[] = [
  { id: 'm1', from: 'me', bodyKey: 'inbox.message1' },
  { id: 'm2', from: 'agent', bodyKey: 'inbox.message2' },
  { id: 'm3', from: 'me', bodyKey: 'inbox.message3' },
  { id: 'm4', from: 'agent', bodyKey: 'inbox.message4' },
]

export const INBOX_REFERENCES: InboxReference[] = [
  { id: 'r1', kind: 'app', labelKey: 'inbox.reference.contract' },
  { id: 'r2', kind: 'file', labelKey: 'inbox.reference.pdf' },
  { id: 'r3', kind: 'repo', labelKey: 'inbox.reference.repo' },
  { id: 'r4', kind: 'app', labelKey: 'inbox.reference.builder' },
]
