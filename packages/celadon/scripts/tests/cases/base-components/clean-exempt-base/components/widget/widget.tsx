/* sample: 同一条用例里放一个"正例"，保证扫描数不为 0 —— 否则豁免样本会假绿 */
import { Button } from '@/components/base/button'

export const Widget = () => <Button variant="ghost">刷新</Button>
