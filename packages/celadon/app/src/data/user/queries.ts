import { logout } from './api'
import { userKeys } from './keys'

/** 退出登录：服务端吊销并清 Cookie（`POST /user/logout`）。 */
export const logoutQuery = () => ({ key: userKeys.logout(), request: logout })
