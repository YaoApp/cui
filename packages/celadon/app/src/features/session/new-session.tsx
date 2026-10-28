import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { Chatbox, type ChatboxAttachment } from '@/components/chatbox'
import { Select } from '@/components/base/select'
import { useTranslation } from '@/platform/i18n'
import type { I18nKey } from '@/platform/i18n/i18n-types'
import {
  createSession,
  listComputers,
  listModels,
  listVaults,
  listWorkspaces,
  type Computer,
  type LlmModel,
  type Vault,
  type VaultGrant,
  type Workspace,
} from '@/data/session'
import { VaultPicker } from './components/vault-picker'
import { listApps, listBots } from '@/data/apps'
import {
  APP_RECOMMENDATIONS,
  BOT_RECOMMENDATIONS,
  recommendationCopy,
  type Recommendation,
} from './recommendations'
import './session.less'

const EFFORTS = ['off', 'low', 'medium', 'high', 'max'] as const

export function NewSessionPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [computers, setComputers] = useState<Computer[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [models, setModels] = useState<LlmModel[]>([])
  const [vaults, setVaults] = useState<Vault[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workspaceId, setWorkspaceId] = useState('')
  const [modelId, setModelId] = useState('')
  const [effort, setEffort] = useState('medium')
  const [grants, setGrants] = useState<VaultGrant>({ group_ids: [], secret_ids: [] })
  const [vaultOpen, setVaultOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [attachments, setAttachments] = useState<ChatboxAttachment[]>([])
  const [creating, setCreating] = useState(false)
  const [selectedAssistant, setSelectedAssistant] = useState<Recommendation | null>(null)
  const [apps, setApps] = useState<Recommendation[]>(APP_RECOMMENDATIONS)
  const [bots, setBots] = useState<Recommendation[]>(BOT_RECOMMENDATIONS)
  const [createMode, setCreateMode] = useState<'app' | 'bot' | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [lifetime, setLifetime] = useState('stop')
  const [approval, setApproval] = useState('writes')

  useEffect(() => {
    let cancelled = false
    Promise.all([listComputers(), listWorkspaces(), listModels(), listVaults()])
      .then(([nextComputers, nextWorkspaces, nextModels, nextVaults]) => {
        if (cancelled) return
        setComputers(nextComputers)
        setWorkspaces(nextWorkspaces)
        setModels(nextModels)
        setVaults(nextVaults)
        setWorkspaceId(nextWorkspaces[0]?.id ?? '')
        setModelId(nextModels[0]?.model_id ?? '')
        setError(null)
      })
      .catch(() => {
        if (!cancelled) setError(t('session.new.noResources'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [t])

  useEffect(() => {
    let cancelled = false
    Promise.all([listApps(), listBots()])
      .then(([nextApps, nextBots]) => {
        if (cancelled) return
        const mappedApps = nextApps
          .map((item) => recommendationCopy(item.id))
          .filter((item): item is Recommendation => item?.kind === 'app')
        const mappedBots = nextBots
          .map((item) => recommendationCopy(item.id))
          .filter((item): item is Recommendation => item?.kind === 'bot')
        if (mappedApps.length > 0) setApps(mappedApps)
        if (mappedBots.length > 0) setBots(mappedBots)
      })
      .catch(() => {
        /* The local catalog remains available when the mock catalog is unreachable. */
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!settingsOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setSettingsOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [settingsOpen])

  useEffect(() => {
    const mode = searchParams.get('create')
    if (mode === 'app' || mode === 'bot') setCreateMode(mode)
  }, [searchParams])

  useEffect(() => {
    const botId = searchParams.get('bot')
    if (!botId) return
    const match = bots.find((item) => item.id === botId)
    if (match) setSelectedAssistant(match)
  }, [bots, searchParams])

  const workspaceGroups = useMemo(
    () =>
      computers
        .map((computer) => ({
          label: computer.name,
          options: workspaces
            .filter((workspace) => workspace.computer_id === computer.id)
            .map((workspace) => ({
              value: workspace.id,
              label: `${workspace.name} · ${workspace.scope === 'team' ? t('session.workspace.team') : t('session.workspace.private')}`,
              description: `${t(`session.role.${workspace.role}` as I18nKey)} · ${workspace.path ?? ''}`,
              disabled: workspace.status === 'offline',
            })),
        }))
        .filter((group) => group.options.length > 0),
    [computers, t, workspaces],
  )

  const modelEffortOptions = useMemo(
    () =>
      models.flatMap((model) =>
        EFFORTS.map((value) => ({
          value: `${model.model_id}::${value}`,
          label: `${model.provider_name} · ${model.name} · ${t(`session.effort.${value}` as I18nKey)}`,
          description: model.reasoning ? t('session.model.reasoning') : undefined,
        })),
      ),
    [models, t],
  )

  const selectedWorkspace = workspaces.find((workspace) => workspace.id === workspaceId)
  const selectedVaultCount = grants.secret_ids.length
  const canSend = Boolean(workspaceId && modelId && !loading && !creating)
  const context = selectedAssistant ? (
    <div className='session-new__context'>
      <span className='session-new__context-icon'>
        <Icon name={selectedAssistant.icon} size={16} />
      </span>
      <span>{t('session.rec.chatting', { name: t(selectedAssistant.nameKey) })}</span>
      <Button
        variant='ghost'
        size='small'
        iconOnly
        aria-label={t('session.rec.removeContext', { name: t(selectedAssistant.nameKey) })}
        icon={<Icon name='i-act-close' size={14} />}
        onClick={() => setSelectedAssistant(null)}
      />
    </div>
  ) : createMode ? (
    <div className='session-new__context is-create'>
      <span className='session-new__context-icon'>
        <Icon name={createMode === 'app' ? 'i-apps' : 'i-bot'} size={16} />
      </span>
      <span>
        {createMode === 'app' ? t('session.rec.createAppContext') : t('session.rec.createBotContext')}
      </span>
      <Button
        variant='ghost'
        size='small'
        iconOnly
        aria-label={t('session.rec.cancel')}
        icon={<Icon name='i-act-close' size={14} />}
        onClick={() => setCreateMode(null)}
      />
    </div>
  ) : null

  async function start() {
    if (!selectedWorkspace || !modelId || !draft.trim()) return
    setCreating(true)
    setError(null)
    try {
      const session = await createSession({
        title: draft.trim().split('\n')[0].slice(0, 80),
        computer_id: selectedWorkspace.computer_id,
        workspace_id: selectedWorkspace.id,
        model: modelId,
        effort,
        lifetime,
        approval,
        agent: selectedAssistant?.id ?? (createMode ? `create-${createMode}` : undefined),
        vault_grants: grants,
      })
      navigate(`/sessions/${session.id}`, {
        state: { initialPrompt: draft.trim(), workspaceId: selectedWorkspace.id, modelId },
      })
    } catch {
      setError(t('session.error.create'))
      setCreating(false)
    }
  }

  function chooseAssistant(item: Recommendation) {
    setSelectedAssistant(item)
    setCreateMode(null)
  }

  function chooseCreate(mode: 'app' | 'bot') {
    setCreateMode(mode)
    setSelectedAssistant(null)
  }

  function openApp(item: Recommendation) {
    navigate(`/apps/${encodeURIComponent(item.id)}?from=new-session`)
  }

  return (
    <div className='session-new'>
      <section className='session-new__intro'>
        <h1>{t('session.rec.title')}</h1>
        <p>{t('session.rec.lede')}</p>
      </section>

      <section className='session-new__composer' aria-label={t('chatbox.label')}>
        <Chatbox
          messages={[]}
          loading={false}
          showHistory={false}
          submitKey='mod-enter'
          surface='content'
          value={draft}
          onValueChange={setDraft}
          onSubmit={start}
          placeholder={
            createMode === 'app'
              ? t('session.rec.createAppContext')
              : createMode === 'bot'
                ? t('session.rec.createBotContext')
                : t('session.placeholder')
          }
          canSend={canSend}
          disabled={loading || creating}
          context={context}
          onFiles={(files) =>
            setAttachments((current) => [
              ...current,
              ...files.map((file) => ({ id: `${file.name}-${file.size}-${Date.now()}`, name: file.name })),
            ])
          }
          attachments={attachments}
          onRemoveAttachment={(id) => setAttachments((current) => current.filter((item) => item.id !== id))}
          onSettings={() => setSettingsOpen(true)}
          resources={
            <>
              <Select
                aria-label={t('session.new.workspace')}
                size='small'
                variant='plain'
                icon={<Icon name='i-ws' size={16} />}
                value={workspaceId}
                onValueChange={setWorkspaceId}
                groups={workspaceGroups}
                placeholder={t('session.new.workspace')}
                emptyText={t('session.new.noResources')}
                disabled={loading}
              />
              <Select
                aria-label={t('session.new.model')}
                size='small'
                variant='plain'
                icon={<Icon name='i-obj-model' size={16} />}
                value={`${modelId}::${effort}`}
                onValueChange={(value) => {
                  const [nextModel, nextEffort] = value.split('::')
                  if (nextModel) setModelId(nextModel)
                  if (nextEffort) setEffort(nextEffort)
                }}
                options={modelEffortOptions}
                placeholder={t('session.new.model')}
                disabled={loading}
              />
            </>
          }
          footer={
            error ? (
              <span className='session-page__error' role='alert'>
                <Icon name='i-state-error' size={14} /> {error}
              </span>
            ) : null
          }
        />
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
                {selectedAssistant
                  ? t(selectedAssistant.nameKey)
                  : createMode === 'app'
                    ? t('session.rec.createAppContext')
                    : createMode === 'bot'
                      ? t('session.rec.createBotContext')
                      : t('session.settings.general')}
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
                {selectedVaultCount > 0
                  ? t('session.vault.selected', { count: selectedVaultCount })
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
            <p className='session-new__settings-note'>{t('session.settings.note')}</p>
            <div className='session-new__settings-foot'>
              <Button variant='ghost' size='small' onClick={() => setSettingsOpen(false)}>
                {t('session.settings.done')}
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <section className='session-new__recommend' aria-label={t('session.rec.recommendTitle')}>
        <div className='session-new__section-head'>
          <h2>{t('session.rec.recommendTitle')}</h2>
          <div className='session-new__create-actions'>
            <Button
              variant='ghost'
              size='small'
              icon={<Icon name='i-plus' size={16} />}
              onClick={() => chooseCreate('app')}
            >
              {t('session.rec.createApp')}
            </Button>
            <Button
              variant='ghost'
              size='small'
              icon={<Icon name='i-plus' size={16} />}
              onClick={() => chooseCreate('bot')}
            >
              {t('session.rec.createBot')}
            </Button>
          </div>
        </div>

        <RecommendationRow
          title={t('session.rec.apps')}
          items={apps}
          selectedId={null}
          onChoose={openApp}
          action={t('session.rec.open')}
        />

        <RecommendationRow
          title={t('session.rec.bots')}
          items={bots}
          selectedId={selectedAssistant?.id ?? null}
          onChoose={chooseAssistant}
          action={t('session.rec.chat')}
        />
      </section>

      <VaultPicker
        open={vaultOpen}
        onOpenChange={setVaultOpen}
        vaults={vaults}
        grants={grants}
        onSave={setGrants}
      />
    </div>
  )
}

function RecommendationRow({
  title,
  items,
  selectedId,
  onChoose,
  action,
}: {
  title: string
  items: Recommendation[]
  selectedId: string | null
  onChoose: (item: Recommendation) => void
  action: string
}) {
  const { t } = useTranslation()
  return (
    <div className='session-new__row'>
      <div className='session-new__row-head'>
        <h3>{title}</h3>
      </div>
      <ul className='session-new__cards'>
        {items.map((item) => {
          const selected = item.id === selectedId
          return (
            <li key={item.id}>
              <Button
                variant='plain'
                size='large'
                className={['session-new__card', selected ? 'is-selected' : null].filter(Boolean).join(' ')}
                aria-pressed={selected}
                onClick={() => onChoose(item)}
              >
                <span className='session-new__card-icon'>
                  <Icon name={item.icon} size={20} />
                </span>
                <span className='session-new__card-copy'>
                  <span className='session-new__card-title'>
                    <strong>{t(item.nameKey)}</strong>
                    {t(item.englishKey) !== t(item.nameKey) ? <em>{t(item.englishKey)}</em> : null}
                  </span>
                  <span className='session-new__card-desc'>{t(item.descriptionKey)}</span>
                  <span className='session-new__card-foot'>
                    <span>{t(item.metaKey)}</span>
                    <span>{selected ? t('session.rec.selected') : action}</span>
                  </span>
                </span>
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
