import { Button } from '@/components/base/button'
import { Header } from '@/components/header'
import { usePrefs } from '@/stores/prefs'
import { api } from '@/data/client'
import { appHref } from '@/platform/utils/nav'
import { load } from './load'

export const InboxPage = () => [Button, Header, usePrefs, api, appHref, load]
