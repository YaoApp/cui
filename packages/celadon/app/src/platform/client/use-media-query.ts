import { useEffect, useState } from 'react'

/* 视口是否落在某个媒体查询里。视口驱动的形态（例如导航列自动进图标轨）用它取信号，
   取到的结果不写进偏好：见 design/foundations.md F6「视口驱动与用户偏好分开」。 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = () => setMatches(list.matches)
    setMatches(list.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}
