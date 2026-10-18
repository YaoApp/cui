import './settings-shell.less'
import { DialogPage } from '@/components/base/dialog'
import { Button } from '@/components/base/button'
import { useTranslation } from '@/platform/i18n'
import type { I18nKey } from '@/platform/i18n/i18n-types'
import type { UserMenuSection } from '@/components/user-menu'

export type SettingsShellProps = {
  open: boolean
  section: UserMenuSection
  onOpenChange: (open: boolean, reason?: string) => void
  onSection: (section: UserMenuSection) => void
}

const SECTIONS: UserMenuSection[] = ['profile', 'team', 'usage']

const SECTION_KEYS: Record<UserMenuSection, I18nKey> = {
  profile: 'account.settings.section.profile',
  team: 'account.settings.section.team',
  usage: 'account.settings.section.usage',
}

/** 设置窗的外壳：左侧三个入口分区，右侧先放占位内容。
    分区内容与其余分区随后一层补，外壳与入口不再改。 */
export function SettingsShell({ open, section, onOpenChange, onSection }: SettingsShellProps) {
  const { t } = useTranslation()
  return (
    <DialogPage
      open={open}
      onOpenChange={onOpenChange}
      title={t('account.settings.title')}
      closeLabel={t('account.settings.close')}
      size='full'
      className='settings-shell'
    >
      <div className='settings-shell__body'>
        <nav className='settings-shell__menu' aria-label={t('account.settings.menu')}>
          {SECTIONS.map((item) => (
            <Button
              key={item}
              variant='plain'
              className='settings-shell__item'
              aria-current={item === section ? 'page' : undefined}
              onClick={() => onSection(item)}
            >
              {t(SECTION_KEYS[item])}
            </Button>
          ))}
        </nav>
        <section className='settings-shell__content'>
          <h2 className='settings-shell__title'>{t(SECTION_KEYS[section])}</h2>
          <p className='settings-shell__hint'>{t('account.settings.placeholder')}</p>
        </section>
      </div>
    </DialogPage>
  )
}
