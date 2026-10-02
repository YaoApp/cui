import { useEffect } from 'react'

/** 应用名，拼在文档标题后面。 */
export const APP_NAME = 'CUI 2.0'

/* 文档标题**跟路由走** —— 标签页、历史、书签、读屏都靠它，所以每条路由都要声明自己的标题。
   `document.title` 是**宿主全局**，因此这个 hook 住平台层（铁律 4：宿主全局只在平台层碰一次）。
   列表页给固定名字；详情页用对象名（如世界名）拼，用户才知道自己开的是哪一个。 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
  }, [title])
}
