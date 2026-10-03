/* 注释里的 import 不该被当成真的 —— 这里两条都会违规，若被误读 clean 就会失败。 */
// import { useInbox } from '@/features/inbox'
/* import { InboxPage } from '@/features/inbox'
   跨行块注释 */
import { api } from '@/data/client'

export const commented = api
