import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { Select } from '@/components/base/select'
import { Chatbox, type ChatboxAttachment } from '@/components/chatbox'
import type { MessageItem } from '@/components/message-list'
import { useTranslation } from '@/platform/i18n'
import type { I18nKey } from '@/platform/i18n/i18n-types'
import {
  createBranch,
  listBranches,
  listComputers,
  listVaults,
  listWorkspaces,
  updateVaultGrants,
  type SessionBranch,
  type Vault,
  type VaultGrant,
} from '@/data/session'
import { useTabsStore } from '@/stores/browser/tabs'
import { useColumnsStore } from '@/stores/layout/columns'
import { MessageActions } from './components/message-actions'
import { VaultPicker } from './components/vault-picker'
import { APP_RECOMMENDATIONS, BOT_RECOMMENDATIONS } from './recommendations'
import { useSession } from './hooks/use-session'
import './session.less'

type SessionLocationState = {
  initialPrompt?: string
}

export function SessionPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const session = useSession(id ?? '')
  const [draft, setDraft] = useState('')
  const [attachments, setAttachments] = useState<ChatboxAttachment[]>([])
  const [vaults, setVaults] = useState<Vault[]>([])
  const [grants, setGrants] = useState<VaultGrant>({ group_ids: [], secret_ids: [] })
  const [vaultOpen, setVaultOpen] = useState(false)
  const [vaultError, setVaultError] = useState<string | null>(null)
  const [branches, setBranches] = useState<SessionBranch[]>([])
  const [branchMenuOpen, setBranchMenuOpen] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [computerName, setComputerName] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [lifetime, setLifetime] = useState('stop')
  const [approval, setApproval] = useState('writes')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [branchingId, setBranchingId] = useState<string | null>(null)
  const [branchError, setBranchError] = useState<string | null>(null)
  const sentInitialRef = useRef(false)
  const initialPrompt = (location.state as SessionLocationState | null)?.initialPrompt

  useEffect(() => {
    let cancelled = false
    listVaults()
      .then((next) => {
        if (!cancelled) setVaults(next)
      })
      .catch(() => {
        /* Vault access is optional; the session remains usable without it. */
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    listBranches(id)
      .then((next) => {
        if (!cancelled) setBranches(next)
      })
      .catch(() => {
        /* Branch discovery is optional; the session remains usable without it. */
      })
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!branchMenuOpen && !settingsOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setBranchMenuOpen(false)
        setSettingsOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [branchMenuOpen, settingsOpen])

  useEffect(() => {
    if (!session.session) return
    setGrants(session.session.vault_grants)
    setLifetime(session.session.lifetime ?? 'stop')
    setApproval(session.session.approval ?? 'writes')
  }, [session.session?.id])

  useEffect(() => {
    if (!session.session) return
    let cancelled = false
    Promise.all([listWorkspaces(), listComputers()])
      .then(([nextWorkspaces, nextComputers]) => {
        if (cancelled) return
        setWorkspaceName(
          nextWorkspaces.find((workspace) => workspace.id === session.session?.workspace_id)?.name ?? '',
        )
        setComputerName(
          nextComputers.find((computer) => computer.id === session.session?.computer_id)?.name ?? '',
        )
      })
      .catch(() => {
        /* Names are decorative; the session still works with its identifiers. */
      })
    return () => {
      cancelled = true
    }
  }, [session.session?.computer_id, session.session?.workspace_id])

  useEffect(() => {
    if (!initialPrompt || sentInitialRef.current || !session.isReady) return
    sentInitialRef.current = true
    session.send(initialPrompt)
  }, [initialPrompt, session])

  if (!id) return null

  const empty = (
    <div className='session-detail__empty'>
      <div className='session-detail__empty-mark' aria-hidden='true'>
        <Icon name='i-spark' size={20} />
      </div>
      <h2>{t('session.empty.title')}</h2>
      <p>{t('session.empty.body')}</p>
    </div>
  )

  const statusText =
    session.state === 'thinking'
      ? t('session.thinking')
      : session.state === 'streaming'
        ? t('session.streaming')
        : session.error
          ? session.error
          : session.connected
            ? t('session.ready')
            : t('session.new.connecting')

  const lastAssistantId = [...session.messages]
    .reverse()
    .find((message) => message.role === 'assistant' && message.kind !== 'error' && message.kind !== 'cancelled')
    ?.id

  const agentRecommendation = [...APP_RECOMMENDATIONS, ...BOT_RECOMMENDATIONS].find(
    (item) => item.id === session.session?.agent,
  )

  function openBranch(branch: SessionBranch) {
    if (!id) return
    const path = `/sessions/${encodeURIComponent(id)}/branches/${encodeURIComponent(branch.id)}`
    useTabsStore.getState().open(
      { kind: 'internal', path },
      { title: branch.title, icon: 'i-branch' },
    )
    if (useColumnsStore.getState().browserCollapsed) useColumnsStore.getState().toggleBrowser()
    setBranchMenuOpen(false)
  }

  async function branchFrom(message: MessageItem) {
    if (!id || branchingId || session.isStreaming) return
    setBranchingId(message.id)
    setBranchError(null)
    try {
      const branch = await createBranch(id, {
        title: `${t('session.branch.action')} · ${session.session?.title ?? t('session.title')}`.slice(0, 60),
        anchor_message_id: message.id,
      })
      setBranches((current) => [...current, branch])
      openBranch(branch)
    } catch {
      setBranchError(t('session.branch.failed'))
    } finally {
      setBranchingId(null)
    }
  }

  async function saveSettings() {
    setSettingsSaving(true)
    setSettingsError(null)
    try {
      await session.update({
        model: session.session?.model ?? '',
        effort: session.session?.effort ?? 'medium',
        lifetime,
        approval,
        agent: session.session?.agent ?? 'general',
      })
      setSettingsOpen(false)
    } catch {
      setSettingsError(t('session.settings.saveFailed'))
    } finally {
      setSettingsSaving(false)
    }
  }

  return (
    <div className='session-page session-page--detail'>
      <div className='session-page__head'>
        <div className='session-page__head-main'>
          <Button
            variant='ghost'
            size='small'
            iconOnly
            aria-label={t('session.back')}
            title={t('session.back')}
            icon={<Icon name='i-left' size={14} />}
            onClick={() => navigate('/new')}
          />
          <span
            className={['session-page__status', session.error ? 'is-error' : null].filter(Boolean).join(' ')}
            title={statusText}
            aria-label={statusText}
          >
            <Icon name={session.error ? 'i-state-error' : 'i-check'} size={14} />
          </span>
          <div className='session-page__identity'>
            <span>{session.session?.title ?? t('session.title')}</span>
            <Button
              variant='soft'
              size='small'
              shape='pill'
              className='session-page__branches'
              aria-expanded={branchMenuOpen}
              aria-controls='session-branches'
              icon={<Icon name='i-branch' size={14} />}
              onClick={() => setBranchMenuOpen((current) => !current)}
            >
              {t('session.branches', { count: branches.length })}
              <Icon name={branchMenuOpen ? 'i-up' : 'i-down'} size={14} />
            </Button>
          </div>
        </div>
        <div className='session-page__meta'>
          {session.session?.workspace_id ? (
            <span>{workspaceName || session.session.workspace_id}</span>
          ) : null}
          {session.session?.computer_id ? (
            <span>{computerName || session.session.computer_id}</span>
          ) : null}
          {session.session?.model ? <span>{session.session.model}</span> : null}
          {session.session?.effort ? (
            <span>{t(`session.effort.${session.session.effort}` as I18nKey)}</span>
          ) : null}
          <span className={session.error ? 'is-error' : undefined}>{statusText}</span>
        </div>
      </div>

      {branchMenuOpen ? (
        <div className='session-branch-menu' id='session-branches' role='menu'>
          <div className='session-branch-menu__head'>
            <span>{session.session?.title ?? t('session.title')}</span>
            <small>{t('session.branch.label')}</small>
          </div>
          {branches.length === 0 ? (
            <p className='session-branch-menu__empty'>{t('session.branch.empty')}</p>
          ) : (
            branches.map((branch) => (
              <Button
                key={branch.id}
                variant='plain'
                size='small'
                role='menuitem'
                className='session-branch-menu__item'
                icon={<Icon name='i-branch' size={14} />}
                onClick={() => openBranch(branch)}
              >
                <span className='session-branch-menu__copy'>
                  <strong>{branch.title}</strong>
                  <small>{t('session.branch.open')}</small>
                </span>
              </Button>
            ))
          )}
        </div>
      ) : null}

      {settingsOpen ? (
        <div className='session-new__settings' role='dialog' aria-label={t('session.new.settings')}>
          <div className='session-new__settings-head'>
            <strong>{t('session.new.settings')}</strong>
            <Button
              variant='ghost'
              size='small'
              iconOnly
              aria-label={t('session.settings.done')}
              icon={<Icon name='i-act-close' size={14} />}
              onClick={() => setSettingsOpen(false)}
            />
          </div>
          <div className='session-new__setting-row'>
            <span>{t('session.settings.agent')}</span>
            <span>
              {agentRecommendation
                ? t(agentRecommendation.nameKey)
                : !session.session?.agent || session.session.agent === 'general'
                  ? t('session.settings.general')
                  : session.session.agent}
            </span>
          </div>
          <div className='session-new__setting-row'>
            <span>{t('session.new.model')}</span>
            <span>
              {session.session?.model ?? '—'} ·{' '}
              {t(`session.effort.${session.session?.effort ?? 'medium'}` as I18nKey)}
            </span>
          </div>
          <div className='session-new__setting-row'>
            <span>{t('session.settings.lifetime')}</span>
            <Select
              aria-label={t('session.settings.lifetime')}
              size='small'
              variant='plain'
              value={lifetime}
              onValueChange={setLifetime}
              options={[
                { value: 'stop', label: t('session.lifecycle.stop') },
                { value: 'keep', label: t('session.lifecycle.keep') },
                { value: 'serve', label: t('session.lifecycle.serve') },
              ]}
            />
          </div>
          <div className='session-new__setting-row'>
            <span>{t('session.vault.title')}</span>
            <Button
              variant='ghost'
              size='small'
              icon={<Icon name='i-obj-key' size={14} />}
              onClick={() => setVaultOpen(true)}
            >
              {grants.secret_ids.length > 0
                ? t('session.vault.selected', { count: grants.secret_ids.length })
                : t('session.vault.noAccess')}
            </Button>
          </div>
          <div className='session-new__setting-row'>
            <span>{t('session.settings.approval')}</span>
            <Select
              aria-label={t('session.settings.approval')}
              size='small'
              variant='plain'
              value={approval}
              onValueChange={setApproval}
              options={[
                { value: 'writes', label: t('session.approval.writes') },
                { value: 'every', label: t('session.approval.every') },
                { value: 'auto', label: t('session.approval.auto') },
              ]}
            />
          </div>
          {settingsError ? (
            <p className='session-page__error' role='alert'>
              <Icon name='i-state-error' size={14} /> {settingsError}
            </p>
          ) : (
            <p className='session-new__settings-note'>{t('session.settings.note')}</p>
          )}
          <div className='session-new__settings-foot'>
            <Button
              variant='solid'
              size='small'
              loading={settingsSaving}
              onClick={() => void saveSettings()}
            >
              {t('session.settings.save')}
            </Button>
          </div>
        </div>
      ) : null}

      <Chatbox
        messages={session.messages}
        loading={session.state === 'loading' && session.messages.length === 0}
        hasMore={session.hasMore}
        loadingMore={session.loadingMore}
        onLoadMore={session.loadMore}
        empty={empty}
        streaming={session.isStreaming}
        value={draft}
        onValueChange={setDraft}
        onSubmit={() => {
          if (session.send(draft)) setDraft('')
        }}
        onStop={session.stop}
        placeholder={t('session.placeholder')}
        canSend={session.isReady}
        disabled={!session.isReady}
        onRetry={session.reload}
        attachments={attachments}
        onRemoveAttachment={(id) => setAttachments((current) => current.filter((item) => item.id !== id))}
        onFiles={(files) =>
          setAttachments((current) => [
            ...current,
            ...files.map((file) => ({ id: `${file.name}-${file.size}-${Date.now()}`, name: file.name })),
          ])
        }
        onSettings={() => setSettingsOpen(true)}
        renderMessageActions={(message) =>
          message.id === lastAssistantId ? (
            <MessageActions
              message={message}
              branching={branchingId === message.id}
              disabled={session.isStreaming}
              onBranch={branchFrom}
            />
          ) : null
        }
        resources={
          session.session?.model ? (
            <span className='session-page__resource'>
              <Icon name='i-obj-model' size={14} />
              {session.session.model} ·{' '}
              {t(`session.effort.${session.session.effort ?? 'medium'}` as I18nKey)}
            </span>
          ) : undefined
        }
        footer={
          session.error || vaultError || branchError ? (
            <span className='session-page__error' role='alert'>
              <Icon name='i-state-error' size={14} /> {branchError ?? vaultError ?? session.error}
              {session.error ? (
                <Button variant='ghost' size='small' onClick={session.reload}>
                  {t('session.retry')}
                </Button>
              ) : null}
            </span>
          ) : null
        }
      />
      <VaultPicker
        open={vaultOpen}
        onOpenChange={setVaultOpen}
        vaults={vaults}
        grants={grants}
        onSave={(next) => {
          setGrants(next)
          setVaultError(null)
          void updateVaultGrants(id, next).catch(() => {
            setVaultError(t('session.vault.saveFailed'))
          })
        }}
      />
    </div>
  )
}
