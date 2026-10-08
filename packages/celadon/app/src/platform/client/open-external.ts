/* **打开外部地址**：宿主能把地址交给系统浏览器时走宿主命令，其余情况由页面整页跳转。
 *
 * `bridge/` 是平台层的内部机制，上层不许直接碰，因此这里给出一个面孔：
 * 第三方授权、帮助链接一类需要离开应用的动作都走它，调用方只给地址。
 */
import { system } from '@/platform/bridge'
import { capabilities } from './capabilities'

export async function openExternal(
  url: string,
  /* 整页跳转是页面自己的动作；留一个可换的接缝，页面与用例都能换掉它 */
  navigate: (target: string) => void = (target) => window.location.assign(target),
): Promise<void> {
  if (capabilities().systemBrowser) {
    const opened = await system.openBrowser(url)
    if (opened.ok) return
  }
  navigate(url)
}
