import './foo-bar.less'

/* feature 的私有组件：只服务 hello，所以住在 features/hello/components/ 下 */
export function FooBar({ name, count }: { name: string; count: number }) {
  return (
    <p className="foo-bar">
      结构试跑：<b>{name}</b>
      <span className="foo-bar__count">已刷新 {count} 次</span>
    </p>
  )
}
