export type WorldEntity = { id: string; name: string; kind: string }
export type World = { id: string; name: string; summary: string; entities: WorldEntity[] }

/* 验证用的静态示例数据。真接数据时它走数据层（见 architecture/05-data-and-api.md）。 */
export const WORLDS: World[] = [
  {
    id: 'w1',
    name: 'Alpha 世界',
    summary: '第一条世界，用来验证列表与详情。',
    entities: [
      { id: 'e1', name: '起点', kind: '地点' },
      { id: 'e2', name: '守门人', kind: '角色' },
    ],
  },
  {
    id: 'w2',
    name: 'Beta 世界',
    summary: '第二条世界，用来验证过滤。',
    entities: [{ id: 'e3', name: '档案馆', kind: '地点' }],
  },
  {
    id: 'w3',
    name: 'Gamma 世界',
    summary: '第三条世界。',
    entities: [{ id: 'e4', name: '信使', kind: '角色' }],
  },
]

export const findWorld = (id: string | undefined): World | undefined => WORLDS.find((w) => w.id === id)

export const findEntity = (world: World | undefined, id: string | undefined): WorldEntity | undefined =>
  world?.entities.find((e) => e.id === id)
