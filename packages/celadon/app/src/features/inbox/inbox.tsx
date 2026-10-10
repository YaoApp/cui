import './inbox.less'
import { Button, Icon } from '@/components/base'
import { Page, PageSection } from '@/components/page'
import { useTranslation } from '@/platform/i18n'
import type { I18nKey } from '@/platform/i18n/i18n-types'
import { INBOX_MESSAGES, INBOX_REFERENCES, INBOX_SESSIONS, type InboxReference } from './mock'

const KIND_KEY: Record<InboxReference['kind'], I18nKey> = {
  app: 'inbox.reference.kind.app',
  file: 'inbox.reference.kind.file',
  repo: 'inbox.reference.kind.repo',
}

/* 收件箱：内容区这一栏画当前会话。演示数据把设计里的形态摆出来 —— 会话头（标题与状态）、
   消息（自己的与对方的）、`@` 引用与输入区（`design/main-shell.md` §二 与场景一），真实数据随后接接口。 */
export function InboxPage() {
  const { t } = useTranslation()
  const session = INBOX_SESSIONS[0]

  return (
    <div className="inbox">
      <header className="inbox__head">
        <h1 className="inbox__title">{t(session.titleKey)}</h1>
        {session.statusKey ? <span className="inbox__status">{t(session.statusKey)}</span> : null}
      </header>

      <Page>
        <PageSection label={t('inbox.navigation.label')}>
          <ul className="inbox__messages">
            {INBOX_MESSAGES.map((message) => (
              <li
                key={message.id}
                className={
                  message.from === 'me' ? 'inbox__message inbox__message--me' : 'inbox__message'
                }
              >
                {t(message.bodyKey)}
              </li>
            ))}
          </ul>
        </PageSection>

        <PageSection heading={t('inbox.quote.title')}>
          <ul className="inbox__refs">
            {INBOX_REFERENCES.map((reference) => (
              <li key={reference.id} className="inbox__ref">
                <span className="inbox__ref-kind">{t(KIND_KEY[reference.kind])}</span>
                <span className="inbox__ref-label">{t(reference.labelKey)}</span>
              </li>
            ))}
          </ul>
        </PageSection>
      </Page>

      <div className="inbox__composer">
        <Button variant="soft" size="small" icon={<Icon name="i-act-attach" size={16} />}>
          {t('inbox.mention.action')}
        </Button>
        <span className="inbox__composer-hint">{t('inbox.composer.hint')}</span>
      </div>
    </div>
  )
}
