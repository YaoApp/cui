/* **打开外部地址**：在当前窗口整页跳转。
 *
 * 第三方授权、帮助链接一类要离开应用的动作都走这个面孔，调用方只给地址；
 * 不在新窗口或系统浏览器里打开，授权与回跳都发生在同一页上。
 */

/** 当前窗口整页跳转。 */
function assign(target: string): void {
  window.location.assign(target)
}

export function openExternal(
  url: string,
  /* 跳转是页面自己的动作；留一个可换的接缝，页面与用例都能换掉它 */
  navigate: (target: string) => void = assign,
): void {
  navigate(url)
}
