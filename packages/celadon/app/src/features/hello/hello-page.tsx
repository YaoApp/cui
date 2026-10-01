import './hello-page.less'
import { Header } from '@/components/header'
import { FooBar } from './components/foo-bar'
import { useHelloStore } from './hello-store'

export function HelloPage() {
  const count = useHelloStore((state) => state.count)
  const refresh = useHelloStore((state) => state.refresh)

  return (
    <div className="hello">
      <Header title="Hello" onRefresh={refresh} />
      <main className="hello__body">
        <FooBar name="CUI 2.0" count={count} />
      </main>
    </div>
  )
}
