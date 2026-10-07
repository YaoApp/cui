# `components/locale-switch`

一个下拉控件，用于切换界面语言。它属于平台控件，建在基础件 `Select` 之上：键盘行为、角色与弹层交给
Select，本组件提供四种语言、各自的本语言写法与 store 调用。形态照登录原型的工具条：纯文字档触发器，
当前语言在左、地球图标在末尾。

## 目录内容

| 路径 | 作用 |
| --- | --- |
| `locale-switch.tsx` | 组件、属性与本语言写法映射。 |
| `locale-switch.test.tsx` | 单元用例：选项、默认项、工具条形态、字段形态、切换后文案变化。 |
| `locales/{zh-CN,zh-TW,en-US,ja}.json` | 组件私有文案：标签、跟随系统项、各语言名。 |
| `index.ts` | 再导出组件与属性类型。 |

## 结构与类名

```
.select-trigger.select-trigger--plain.locale-switch   (role=combobox)
├── span.select__value          当前语言，或「跟随系统（…）」
└── span.select__lead           地球图标，画在值之后
    └── span.select__lead-icon
        └── svg.icon            i-globe
```

下拉指示器关掉了（`indicator={false}`），因为地球图标已经说明了这个控件的用途。弹层用基础件自己的
listbox，选项行显示各语言的本语言写法。

## 属性

| 属性 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `variant` | `'field' \| 'plain'` | `'plain'` | 工具条形态（无底无框）或字段形态。 |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 触发器档位，24 / 32 / 40。 |

## 选项

| 取值 | 显示的文案 | 来源 |
| --- | --- | --- |
| `system` | `localeSwitch.system` 填入解析出的语言，例如「跟随系统（简体中文）」 | 本目录语言包，`{{locale}}` 插值。 |
| `zh-CN` | 中文 | 本目录语言包 `localeSwitch.zhCN`。 |
| `zh-TW` | 繁體中文 | 本目录语言包 `localeSwitch.zhTW`。 |
| `en-US` | English | 本目录语言包 `localeSwitch.enUS`。 |
| `ja` | 日本語 | 本目录语言包 `localeSwitch.ja`。 |

语言名用各自语言的写法（endonym），所以不参与翻译；同一个值出现在四份语言包里是正确的，检查器里已登记。
新增语言还没有本语言写法时退回英文名。

## 行为

选中一项会调用语言 store，由 store 应用语言并持久化选择；组件自己不写字段。文案就地更新，页面不刷新，
已经输入的内容不丢。

`system` 是一等的选项，不是「重置」：它的文案里带着系统当前解析出的语言，用户看得见跟随系统意味着什么。
用户显式选过语言之后，应用就不再跟随系统。

## 尺寸与实测值

| 档位 | 触发器盒高 | 地球 |
| --- | --- | --- |
| `small` | 24 | 16 |
| `medium` | 32 | 16 |
| `large` | 40 | 16 |

工具条形态在清单页实测：触发器盒高 32，地球落在 835–851，而触发器占 670–860，图标因此在控件之内、
位于后半段；指示器不存在。

## 状态

状态全部来自基础件 Select：默认、悬停、焦点（只有键盘聚焦画环）、禁用，以及加载过程（把指针换成进行中）。
本组件不新增状态。

## 无障碍

触发器就是基础件 Select 的 combobox，`aria-label` 取自 `localeSwitch.label`（「语言」）。键盘操作、选项角色
与高亮项都由基础件负责；各语言的本语言写法就是选项的可访问名，因此每种语言都用自己的话被念出来。

## 类与 token

| 位置 | 内容 |
| --- | --- |
| `.locale-switch` | 组件自己的钩子，落在触发器上。 |
| `.select-trigger--plain` | 工具条形态：透明底、无框、悬停底、聚焦环。 |
| `.select-trigger--field` | 字段形态：字段 token 给的底、描边与圆角。 |
| `.select-trigger--{small,large}` | 尺寸档覆盖。 |

## 用法

```tsx
<LocaleSwitch />                        {/* 工具条：纯文字档触发器，地球在末尾 */}
<LocaleSwitch variant="field" />        {/* 需要边框的位置 */}
<LocaleSwitch size="small" />           {/* 密集的工具条 */}
```

## 验证方式

- `app/src/components/locale-switch/locale-switch.test.tsx`：五个选项、默认项及其解析出的语言、工具条形态
  （纯文字档类名、地球在最后、无指示器）、字段形态，以及切换语言后可见文案跟着变。
- `app/src/features/scaffold/base/tests/base.browser.ts`：触发器形态、地球在控件内且靠后，以及不刷新页面
  切到日文再切回来。

## 已知限制

- 四种语言由 `SUPPORTED_LOCALES` 固定；新增语言需要一份语言包，并在这里登记本语言写法。
- 地球是装饰性图标，对辅助技术隐藏；可访问名来自触发器标签与选项文字。
