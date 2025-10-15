import Layout from './layout'
import Login from './login'
import Entry from './entry'
import Messages from './messages'

export type Locale = 'zh-CN' | 'en-US'

export interface LocaleMessages {
	layout: Layout
	login: Login
	entry: Entry
	messages: Messages
}
