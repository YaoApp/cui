import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/base/button'
import { Checkbox } from '@/components/base/checkbox'
import { DialogPage } from '@/components/base/dialog'
import { Input } from '@/components/base/input'
import { useTranslation } from '@/platform/i18n'
import type { Vault, VaultGrant } from '@/data/session'
import './vault-picker.less'

export type VaultPickerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  vaults: Vault[]
  grants: VaultGrant
  onSave: (grants: VaultGrant) => void
}

export function VaultPicker({ open, onOpenChange, vaults, grants, onSave }: VaultPickerProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [groupIds, setGroupIds] = useState<string[]>(grants.group_ids)
  const [secretIds, setSecretIds] = useState<string[]>(grants.secret_ids)

  useEffect(() => {
    if (!open) return
    setGroupIds(grants.group_ids)
    setSecretIds(grants.secret_ids)
    setQuery('')
  }, [grants.group_ids, grants.secret_ids, open])

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (!needle) return vaults
    return vaults
      .map((vault) => ({
        ...vault,
        groups: vault.groups
          .map((group) => ({
            ...group,
            secrets: group.secrets.filter(
              (secret) =>
                secret.name.toLocaleLowerCase().includes(needle) ||
                secret.kind.toLocaleLowerCase().includes(needle) ||
                group.name.toLocaleLowerCase().includes(needle),
            ),
          }))
          .filter((group) => group.name.toLocaleLowerCase().includes(needle) || group.secrets.length > 0),
        secrets: vault.secrets.filter(
          (secret) =>
            secret.name.toLocaleLowerCase().includes(needle) ||
            secret.kind.toLocaleLowerCase().includes(needle),
        ),
      }))
      .filter((vault) => vault.groups.length > 0 || vault.secrets.length > 0)
  }, [query, vaults])

  function toggleGroup(groupId: string, groupSecrets: string[], checked: boolean) {
    setGroupIds((current) =>
      checked ? [...new Set([...current, groupId])] : current.filter((id) => id !== groupId),
    )
    setSecretIds((current) =>
      checked
        ? [...new Set([...current, ...groupSecrets])]
        : current.filter((id) => !groupSecrets.includes(id)),
    )
  }

  function toggleSecret(groupId: string, secretId: string, checked: boolean) {
    setSecretIds((current) =>
      checked ? [...new Set([...current, secretId])] : current.filter((id) => id !== secretId),
    )
    if (!checked) setGroupIds((current) => current.filter((id) => id !== groupId))
  }

  const selectedCount = new Set(secretIds).size

  return (
    <DialogPage
      open={open}
      onOpenChange={onOpenChange}
      title={t('session.vault.title')}
      description={t('session.vault.hint')}
      closeLabel={t('modal.close')}
      size='page'
      footer={
        <>
          <Button
            variant='ghost'
            onClick={() => {
              setGroupIds([])
              setSecretIds([])
            }}
            disabled={groupIds.length === 0 && secretIds.length === 0}
          >
            {t('session.vault.clear')}
          </Button>
          <Button
            variant='solid'
            onClick={() => {
              onSave({ group_ids: groupIds, secret_ids: secretIds })
              onOpenChange(false)
            }}
          >
            {t('session.vault.done')}
          </Button>
        </>
      }
    >
      <div className='vault-picker'>
        <Input
          id='vault-search'
          type='search'
          value={query}
          placeholder={t('session.vault.search')}
          aria-label={t('session.vault.search')}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className='vault-picker__summary'>{t('session.vault.selected', { count: selectedCount })}</div>

        {filtered.length === 0 ? (
          <p className='vault-picker__empty'>{t('session.vault.empty')}</p>
        ) : (
          <div className='vault-picker__list'>
            {filtered.map((vault) => (
              <section key={vault.id} className='vault-picker__vault' aria-label={vault.name}>
                <h3 className='vault-picker__vault-name'>{vault.name}</h3>
                {vault.groups.map((group) => {
                  const all = group.secrets.length > 0 && group.secrets.every((secret) => secretIds.includes(secret.id))
                  const some = group.secrets.some((secret) => secretIds.includes(secret.id))
                  return (
                    <div key={group.id} className='vault-picker__group'>
                      <Checkbox
                        id={`vault-group-${group.id}`}
                        label={
                          <span className='vault-picker__group-label'>
                            <span>{group.name}</span>
                            <small>
                              {group.permission} · {t('session.vault.secretCount', { count: group.secrets.length })}
                            </small>
                          </span>
                        }
                        checked={all}
                        indeterminate={some && !all}
                        onCheckedChange={(checked) =>
                          toggleGroup(
                            group.id,
                            group.secrets.map((secret) => secret.id),
                            checked,
                          )
                        }
                      />
                      <div className='vault-picker__secrets'>
                        {group.secrets.map((secret) => (
                          <Checkbox
                            key={secret.id}
                            id={`vault-secret-${secret.id}`}
                            label={
                              <span className='vault-picker__secret-label'>
                                <span>{secret.name}</span>
                                <small>{secret.kind}</small>
                              </span>
                            }
                            checked={secretIds.includes(secret.id)}
                            onCheckedChange={(checked) => toggleSecret(group.id, secret.id, checked)}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
                {vault.secrets.length > 0 ? (
                  <div className='vault-picker__ungrouped'>
                    {vault.secrets.map((secret) => (
                      <Checkbox
                        key={secret.id}
                        id={`vault-root-secret-${secret.id}`}
                        label={
                          <span className='vault-picker__secret-label'>
                            <span>{secret.name}</span>
                            <small>{secret.kind}</small>
                          </span>
                        }
                        checked={secretIds.includes(secret.id)}
                        onCheckedChange={(checked) => toggleSecret('', secret.id, checked)}
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        )}
      </div>
    </DialogPage>
  )
}
