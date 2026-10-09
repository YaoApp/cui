import type { useNavigate } from 'react-router'

/**
 * 登录收尾之后的去向：只有落在本应用命名空间之下的地址走路由，其余整页跳转。
 *
 * 入口配置里的成功地址通常由服务端给（例如引擎自己的页面），它同源但不属于本应用的路由表，
 * 交给路由会落到兜底重定向。判断只认命名空间前缀，因此不需要解析来源。
 * 欢迎页点「继续」时用它，把会话后的去向集中在这一处。
 */
export function goToSuccess(
  navigate: ReturnType<typeof useNavigate>,
  url: string,
  basename: string,
  /* 整页跳转是页面自己的动作；留一个可换的接缝，页面与用例都能换掉它 */
  assign: (target: string) => void = (target) => window.location.assign(target),
) {
  const prefix = basename ? `/${basename}` : ''
  const sameApp = prefix ? url === prefix || url.startsWith(`${prefix}/`) : url.startsWith('/')

  if (!sameApp) {
    assign(url)
    return
  }

  const trimmed = prefix ? url.slice(prefix.length) : url
  navigate(trimmed.startsWith('/') ? trimmed : `/${trimmed}`)
}
