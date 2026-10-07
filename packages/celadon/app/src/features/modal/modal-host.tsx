import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { DialogPage, type DialogSize } from '@/components/base/dialog'
import { useTranslation } from '@/platform/i18n'

/** 一个可被打开的弹窗页面：标题走语言包的键，正文与底部操作由页面自己给。 */
export type ModalPageDefinition<Params = unknown> = {
  /** 标题在语言包里的键（各 feature 自己的包）。 */
  titleKey: string
  /** 标题下的一句说明，同样给键。 */
  descriptionKey?: string
  /** 宽度档，默认表单档。 */
  size?: DialogSize
  /** 页面正文。 */
  body: (props: { params: Params; close: () => void }) => ReactNode
  /** 固定底部操作；省略则不渲染底部。 */
  footer?: (props: { params: Params; close: () => void }) => ReactNode
}

/** 页面注册表：名字到页面定义的映射。 */
export type ModalPageRegistry = Record<string, ModalPageDefinition<never>>

export type ModalPageApi = {
  /** 打开一个已登记的页面；重复打开同名页面即替换参数。 */
  open: <Params>(name: string, params?: Params) => void
  close: () => void
  isOpen: (name: string) => boolean
  /** 当前打开页面的名字；没有打开时为 `null`。 */
  current: string | null
}

const ModalPageContext = createContext<ModalPageApi | null>(null)

/**
 * 弹窗页面的宿主：把「打开哪个页面、带什么参数」这件事收在一处。
 *
 * 页面在一张注册表里登记（名字 → 标题键 · 宽度档 · 正文 · 底部操作），调用方只调 `open(name, params)`；
 * 面板本身由基础件 `DialogPage` 画，行为（焦点陷阱 · Esc · 点遮罩 · 焦点归位）在上游。
 * 宿主不限制同时打开的层数：页面自己再开一层由上游的嵌套能力承担。
 *
 * 关闭分两步：`close()` 先把面板置为关闭让退场动画跑完，页面定义留到上游的
 * `onOpenChangeComplete` 回调里再清掉；直接卸载会把退场动画一起省掉。
 */
export function ModalPageHost({ registry, children }: { registry: ModalPageRegistry; children: ReactNode }) {
  const { t } = useTranslation()
  const [current, setCurrent] = useState<string | null>(null)
  const [params, setParams] = useState<unknown>(undefined)
  const [visible, setVisible] = useState(false)

  const open = useCallback(
    <Params,>(name: string, next?: Params) => {
      /* 没登记的名字不打开：否则 current 指着不存在的页面，isOpen 会说谎、面板却是空的 */
      if (!registry[name]) return
      setCurrent(name)
      setParams(next as unknown)
      setVisible(true)
    },
    [registry],
  )
  const close = useCallback(() => setVisible(false), [])

  const api = useMemo<ModalPageApi>(
    () => ({
      open,
      close,
      isOpen: (name: string) => visible && current === name,
      current,
    }),
    [open, close, visible, current],
  )

  const definition = current ? (registry[current] as ModalPageDefinition<unknown> | undefined) : undefined

  return (
    <ModalPageContext.Provider value={api}>
      {children}
      {definition ? (
        <DialogPage
          open={visible}
          onOpenChange={(next) => {
            if (!next) close()
          }}
          onOpenChangeComplete={(next) => {
            /* 退场走完才卸载页面定义，并把参数一并清掉，避免下次打开看到上一次的值 */
            if (!next) {
              setCurrent(null)
              setParams(undefined)
            }
          }}
          size={definition.size}
          title={t(definition.titleKey as never)}
          description={definition.descriptionKey ? t(definition.descriptionKey as never) : undefined}
          /* 关闭钮的无障碍名由宿主统一给，四个语言包里都在同一处 */
          closeLabel={t('modal.close' as never)}
          footer={definition.footer?.({ params, close })}
        >
          {definition.body({ params, close })}
        </DialogPage>
      ) : null}
    </ModalPageContext.Provider>
  )
}

/** 取宿主的接口；没有宿主时抛错，避免静默不工作。 */
export function useModalPage(): ModalPageApi {
  const api = useContext(ModalPageContext)
  if (!api) throw new Error('useModalPage must be used inside ModalPageHost')
  return api
}
