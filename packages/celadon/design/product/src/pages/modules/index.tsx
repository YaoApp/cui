import { useMemo, useState } from 'react'
import logo from '../../../../logo-mark-ghost.svg'
import { ModuleCard } from '../../components/module-card'
import { globalFunctions, modules } from '../../product-map'

export function ModulesPage() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return modules
    return modules.filter((module) =>
      `${module.label} ${module.english} ${module.definition}`.toLowerCase().includes(needle),
    )
  }, [query])

  return (
    <div className="launch">
      <header className="launch-head">
        <div className="brand">
          <img src={logo} alt="" />
          <span>Yao Agents</span>
        </div>
        <div className="launch-meta">
          <span>产品设计</span>
          <span className="status">草案</span>
        </div>
      </header>

      <main className="launch-main">
        <div className="hero">
          <span className="eyebrow">00 · Module map</span>
          <h1>模块</h1>
          <p className="lede">产品的一级入口。先定这一层，再逐项展开页面与功能。</p>
        </div>

        <label className="search">
          <span className="search-label">筛选模块</span>
          <input
            type="search"
            placeholder="输入模块名"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        {filtered.length > 0 ? (
          <div className="module-grid">
            {filtered.map((module) =>
              module.id === 'new' ? (
                <a className="card-link" href="/new-session" key={module.id}>
                  <ModuleCard module={module} />
                </a>
              ) : module.id === 'apps' ? (
                <a className="card-link" href="/apps" key={module.id}>
                  <ModuleCard module={module} />
                </a>
              ) : (
                <ModuleCard key={module.id} module={module} />
              ),
            )}
          </div>
        ) : (
          <div className="empty">
            <strong>没有匹配的模块</strong>
            <span>换一个名字再试。</span>
          </div>
        )}

        <footer className="launch-foot">
          <span>全局能力</span>
          {globalFunctions.map((item) => (
            <span className="tag" key={item}>
              {item}
            </span>
          ))}
        </footer>
      </main>
    </div>
  )
}
