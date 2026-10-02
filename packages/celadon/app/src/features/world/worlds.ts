import type { I18nKey } from '@/platform/i18n'

/** 实体种类 —— **系统值**（枚举），必须走语言包；数据里只放 code（见 architecture/08-i18n.md §6）。 */
export type WorldEntityKind = 'place' | 'role'

/* 验证用的静态示例数据 —— 它是**我们自己的夹具**，所以文字跟语言走（见 architecture/08-i18n.md §6）：
   夹具持有语言包 key，展示时由组件用 `t()` 取；`id` 与 `kind` 是 code，不随语言变。
   真接数据时它走数据层（见 architecture/05-data-and-api.md），接口返回的成品文本原样显示、不翻译。 */
export type WorldEntity = { id: string; nameKey: I18nKey; kind: WorldEntityKind }
export type World = { id: string; nameKey: I18nKey; summaryKey: I18nKey; entities: WorldEntity[] }

/** 系统值 code → 语言包 key 的唯一映射（别在组件里拼 key）。 */
export const WORLD_ENTITY_KIND_KEY: Record<WorldEntityKind, I18nKey> = {
  place: 'world.kind.place',
  role: 'world.kind.role',
}

export const WORLDS: World[] = [
  {
    id: 'w1',
    nameKey: 'world.fixture.w1.name',
    summaryKey: 'world.fixture.w1.summary',
    entities: [
      { id: 'e1', nameKey: 'world.fixture.e1.name', kind: 'place' },
      { id: 'e2', nameKey: 'world.fixture.e2.name', kind: 'role' },
    ],
  },
  {
    id: 'w2',
    nameKey: 'world.fixture.w2.name',
    summaryKey: 'world.fixture.w2.summary',
    entities: [{ id: 'e3', nameKey: 'world.fixture.e3.name', kind: 'place' }],
  },
  {
    id: 'w3',
    nameKey: 'world.fixture.w3.name',
    summaryKey: 'world.fixture.w3.summary',
    entities: [{ id: 'e4', nameKey: 'world.fixture.e4.name', kind: 'role' }],
  },
]

export const findWorld = (id: string | undefined): World | undefined => WORLDS.find((w) => w.id === id)

export const findEntity = (world: World | undefined, id: string | undefined): WorldEntity | undefined =>
  world?.entities.find((e) => e.id === id)
