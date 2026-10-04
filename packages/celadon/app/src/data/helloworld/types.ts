/* 脚手架 `helloworld` 的返回体。
 *
 * **大写键是引擎的线上形状**（`yao/openapi/hello/hello.go:37-48`）：`MESSAGE` · `SERVER_TIME` ·
 * `VERSION` · `CUI` · `APP` · `QUERYSTRING` · `POST_PAYLOAD` 等。
 * 真实域会加该域的 `map.ts` 把线上字段转成应用里的名字（`plan/03-data.md` §0 的转换规则）；
 * 脚手架**先照原样收**，好让"地址 → 出口 → 解包裹"这条路一眼看清 —— **它返回的是裸对象，没有信封**。
 */

export type HelloWorld = {
  MESSAGE: string
  SERVER_TIME?: string
  VERSION?: string
  PRVERSION?: string
  CUI?: string
  PRCUI?: string
  APP?: string
  APP_VERSION?: string
  QUERYSTRING?: string
  POST_PAYLOAD?: unknown
}
