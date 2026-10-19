import type { ProductModule } from '../product-map'
import { Icon } from './icon'

export function ModuleCard({ module }: { module: ProductModule }) {
  return (
    <article className="card">
      <div className="card-head">
        <span className="card-index">{module.index}</span>
        <span className="card-icon">
          <Icon name={module.icon} />
        </span>
      </div>
      <div className="card-title">
        <h2>{module.label}</h2>
        {module.english === module.label ? null : <span>{module.english}</span>}
      </div>
      <p>{module.definition}</p>
    </article>
  )
}
