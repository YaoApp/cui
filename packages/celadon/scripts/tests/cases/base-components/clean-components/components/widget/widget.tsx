/* sample: components/ 里用基础件 —— 正确 */
import { Button } from '@/components/base/button'
import { Select } from '@/components/base/select'

export const Widget = () => (
  <>
    <Button variant="ghost">刷新</Button>
    <Select aria-label="语言" value="system" onChange={() => {}} options={[]} />
  </>
)
