import { InboxPage } from '@/features/inbox'
import { Header } from '@/components/header'
import { usePrefs } from '@/stores/prefs'
import { api } from '@/data/client'
import { appHref } from '@/platform/utils/nav'

export const routes = [InboxPage, Header, usePrefs, api, appHref]
