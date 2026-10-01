import './header.less'
import { Button } from '@/components/base/button'

export function Header({ title, onRefresh }: { title: string; onRefresh?: () => void }) {
  return (
    <header className="header">
      <h1 className="header__title">{title}</h1>
      <Button variant="soft" size="small" onClick={onRefresh}>
        刷新
      </Button>
    </header>
  )
}
