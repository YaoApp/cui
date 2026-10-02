import './hello.less'
import { useLocation, useNavigate } from 'react-router'
import { Header } from '@/components/header'
import { Nav } from '@/components/nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { useThemeStore } from '@/platform/theme/theme.store'
import { navWithActive } from '@/platform/utils/nav'
import { FooBar } from './components/foo-bar'
import { useHelloStore } from './hello.store'

export function HelloPage() {
  const count = useHelloStore((state) => state.count)
  const refresh = useHelloStore((state) => state.refresh)
  // 主题住在平台层；feature 把它取出来，交给纯组件去显示与触发
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="hello">
      <Header title="Hello" onRefresh={refresh}>
        {/* 头部导航与 World 用的是同一个组件，只是 items 不同 */}
        <Nav items={navWithActive(pathname)} label="应用导航" onSelect={(item) => navigate(item.href)} />
      </Header>
      <main className="hello__body">
        <FooBar name="CUI 2.0" count={count} />
        <div className="hello__actions">
          <ThemeToggle theme={theme} onChange={setTheme} />
        </div>
      </main>
    </div>
  )
}
