# components/base/avatar

`components/base/avatar` 是账号头像：有照片用照片，没有照片用名字首字母，底为品牌实心、字为反色。
团队账号在右下角叠一个更小的团队徽标。

这一件只负责展示，不认识账号、团队与接口。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `avatar.tsx` | `Avatar` 组件、`AvatarProps`、`AvatarSize` 与 `AvatarTeam`。 |
| `avatar.less` | 三档尺寸、品牌底、团队徽标与加载呼吸。 |
| `avatar.test.tsx` | 单元用例：首字母、中文名、图片回退、团队徽标、加载态、可访问名。 |
| `index.ts` | 对外出口。 |

## 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `name` | `string` | 无 | 显示名；取第一个字符，空名回退 `U`。 |
| `src` | `string` | 无 | 照片地址；加载失败回退首字母。 |
| `size` | `24 \| 32 \| 64` | `32` | 24 用于紧凑行，32 用于菜单与导航列底部，64 用于资料页。 |
| `team` | `{ name: string }` | 无 | 画团队徽标：32 头像配 16，64 头像配 24，取团队名首字。 |
| `loading` | `boolean` | `false` | 画同尺寸骨架，不画首字母。 |
| `label` | `string` | 无 | 无障碍名；不传按装饰处理。 |
| `className` | `string` | 无 | 追加类名。 |

## 使用方式

```tsx
<Avatar name="Mock OAuth User" team={{ name: 'Administrator Team' }} />
<Avatar name="Mock OAuth User" src={profile.avatar} size={64} label="Mock OAuth User" />
```

## 无障碍

- 不传 `label` 时头像 `aria-hidden`，含义由旁边可见的名字承担。
- 传 `label` 时变成 `role="img"` 并带该名字，资料页用这一档。
- 团队徽标是装饰，团队名总是另外写在旁边或团队行里。

## 约定

- 颜色只取 token：`--brand`、`--brand-text`、`--brand-soft`、`--brand-ink`。
- 徽标外圈取两个 `--border-width` 的 `--background-surface`，让两层圆分开。
- 首字母与徽标字取 `--line-height-none`（1）；沿用 20px 行高时，16 的徽标里字形会低 4px，拉丁与中日文都一样。
- 不写字面尺寸：三档用 `--spacing-24`、`--spacing-32` 与两倍 `--spacing-32`。

## 验证方式

单元用例与组件同目录：`avatar.test.tsx`。
