import './inbox.less'
import { Icon } from '@/components/base'
import { useTranslation } from '@/platform/i18n'
import { INBOX_SESSIONS } from './mock'

/* 收件箱的二级导航（导航列「当前」区里的内容）：会话列表。
   演示数据把三条会话与各自的状态、未读数摆出来，选中第一条；真实数据随后接接口。 */
export function InboxNav() {
  const { t } = useTranslation()
  const unread = INBOX_SESSIONS.reduce((total, session) => total + (session.unread ?? 0), 0)

  return (
    <ul className="inbox-nav" aria-label={t('inbox.navigation.label')}>
      <li className="inbox-nav__section">
        <span>{t('inbox.title')}</span>
        <span className="inbox-nav__count">
          {unread} {t('inbox.unread')}
        </span>
      </li>
      {INBOX_SESSIONS.map((session, index) => (
        <li key={session.id}>
          <span
            className={index === 0 ? 'inbox-nav__item is-active' : 'inbox-nav__item'}
            aria-current={index === 0 ? 'page' : undefined}
          >
            <span className="inbox-nav__title">
              {t(session.titleKey)}
              {session.unread ? <span className="inbox-nav__badge">{session.unread}</span> : null}
            </span>
            <span className="inbox-nav__summary">{t(session.summaryKey)}</span>
          </span>
        </li>
      ))}
      <li>
        <span className="inbox-nav__empty">
          <Icon name="i-inbox" size={14} />
          {t('inbox.navigation.empty')}
        </span>
      </li>
    </ul>
  )
}
