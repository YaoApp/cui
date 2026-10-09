/* 客户端栏里的服务器名：本机记录命中就用它的显示名，自建那条没有名字，用「自建」；
   一条记录都没有就退回地址本身，不拿服务信息里的产品名充数。 */
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { rememberServer } from './server-history'
import { useServerName } from './use-server-name'

const BASE = 'https://service.example.com'

function Probe() {
  return <span data-testid="name">{useServerName()}</span>
}

describe('the server name in the client bar', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubEnv('VITE_SERVICE_BASE', BASE)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses the display name recorded for this address', () => {
    rememberServer(`${BASE}/`, 'Polaris (Trial Server)', 1)
    render(<Probe />)
    expect(screen.getByTestId('name').textContent).toBe('Polaris (Trial Server)')
  })

  it('calls a record without a name the self-hosted one', () => {
    rememberServer(BASE, undefined, 1)
    render(<Probe />)
    expect(screen.getByTestId('name').textContent).toBe('自建')
  })

  it('falls back to the bare address when nothing is recorded', () => {
    render(<Probe />)
    expect(screen.getByTestId('name').textContent).toBe('service.example.com')
  })

  it('shows nothing on the web until the service info arrives', () => {
    vi.unstubAllEnvs()
    render(<Probe />)
    /* Web 的名字来自服务信息；这里没读过服务信息，就不编一个名字出来 */
    expect(screen.getByTestId('name').textContent).toBe('')
  })
})
