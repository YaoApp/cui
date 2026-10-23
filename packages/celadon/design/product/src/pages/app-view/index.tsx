import { readApp } from '../apps-index/data'
import { MissingApp } from './exclusive'
import { PosterStudio } from './poster-studio'
import { ProductShots } from './product-shots'
import { TeachingAids } from './teaching-aids'
import './app-view.css'

export function AppViewPage({ appId }: { appId: string }) {
  const app = readApp(appId)

  if (!app) return <MissingApp />
  if (app.id === 'poster-studio') return <PosterStudio app={app} />
  if (app.id === 'product-shots') return <ProductShots app={app} />
  if (app.id === 'teaching-aids') return <TeachingAids app={app} />
  return <MissingApp />
}
