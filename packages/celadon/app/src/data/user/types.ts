/* 引擎 `user` 域的线上形状（`openapi/user/`）。 */

/** `POST /user/logout` 的返回：服务端吊销令牌并清掉认证 Cookie。 */
export type LogoutResult = {
  message: string
}
