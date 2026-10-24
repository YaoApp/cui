import type { IconId } from '../../../../app/src/platform/icons/icon-ids'

export type WorkspaceScope = 'private' | 'team'
export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer'
export type WorkspaceTab = 'files' | 'access' | 'apps' | 'settings'
export type WorkspaceTone = 'brand' | 'success' | 'warning' | 'neutral'

export type WorkspaceFile = {
  name: string
  path: string
  type: 'file' | 'folder'
  size?: string
  updated: string
  content?: string
  language?: string
  git?: { branch: string; changes: number }
}

export type WorkspaceMember = {
  id: string
  name: string
  email: string
  role: WorkspaceRole
}

export type WorkspaceApp = {
  id: string
  name: string
  description: string
  domain: string
  icon: IconId
  tone: WorkspaceTone
}

export type Workspace = {
  id: string
  name: string
  description: string
  scope: WorkspaceScope
  computerId: string
  computerName: string
  computerOs: string
  role: WorkspaceRole
  createdAt: string
  updatedAt: string
  files: WorkspaceFile[]
  members: WorkspaceMember[]
  apps: WorkspaceApp[]
}

export const roleMeta: Record<WorkspaceRole, { label: string; tone: WorkspaceTone }> = {
  owner: { label: '所有者', tone: 'brand' },
  admin: { label: '管理员', tone: 'brand' },
  editor: { label: '编辑者', tone: 'success' },
  viewer: { label: '只读', tone: 'neutral' },
}

export const scopeMeta: Record<WorkspaceScope, { label: string; description: string; icon: IconId }> = {
  private: { label: 'Private', description: '只有自己可见', icon: 'i-lock' },
  team: { label: 'Team', description: '团队成员可见', icon: 'i-nav-team' },
}

export const computers = [
  { id: 'mac-studio', name: 'Mac Studio · 研究机', os: 'macOS 15.1' },
  { id: 'macbook-pro', name: 'Wren 的 MacBook Pro', os: 'macOS 15.1' },
  { id: 'linux-build', name: 'Linux 构建机', os: 'Ubuntu 24.04' },
]

const sharedFiles: WorkspaceFile[] = [
  {
    name: 'README.md',
    path: '/README.md',
    type: 'file',
    size: '2.4 KB',
    updated: '12 分钟前',
    language: 'markdown',
    content: `# Brand Launch

A shared workspace for the spring campaign.

## What is in here

- brief.md: campaign brief and audience notes
- campaigns/: final key visual, copy, and exports
- assets/: working files and source material

## Working agreement

Keep final exports in campaigns/. Put explorations in assets/ and add a short note in the file header. Do not overwrite another editor's key visual without leaving a comment in the campaign thread.`,
  },
  {
    name: 'brief.md',
    path: '/brief.md',
    type: 'file',
    size: '6.1 KB',
    updated: '1 小时前',
    language: 'markdown',
    content: `# Spring campaign brief

## Audience

Product teams who need a calmer way to run agents across their computers.

## Direction

Use the ghost mark as a quiet anchor. Keep the field warm and the copy direct. The campaign should feel like a workspace that is already in use, not a launch poster.

## Deliverables

1. Key visual for the launch page
2. Three stills for the social carousel
3. A short copy deck for the partner newsletter`,
  },
  {
    name: 'campaigns',
    path: '/campaigns',
    type: 'folder',
    updated: '1 小时前',
    git: { branch: 'main', changes: 3 },
  },
  {
    name: 'key-visual.png',
    path: '/campaigns/key-visual.png',
    type: 'file',
    size: '4.8 MB',
    updated: '1 小时前',
  },
  {
    name: 'copy.md',
    path: '/campaigns/copy.md',
    type: 'file',
    size: '3.2 KB',
    updated: '2 小时前',
    language: 'markdown',
    content: `# Launch copy

## Headline

All your agents and workspaces, on every computer you own.

## Body

Yao Agents keeps the work close to the machine that runs it. Open a workspace, start a session, and let the agent work with the files that are already there.

## CTA

Open the workspace`,
  },
  {
    name: 'assets',
    path: '/assets',
    type: 'folder',
    updated: '昨天',
  },
  {
    name: 'logo.svg',
    path: '/assets/logo.svg',
    type: 'file',
    size: '18 KB',
    updated: '昨天',
  },
]

const researchFiles: WorkspaceFile[] = [
  {
    name: 'README.md',
    path: '/README.md',
    type: 'file',
    size: '1.2 KB',
    updated: '12 分钟前',
    language: 'markdown',
    content: `# Research Notes

Private working notes for the workspace model.

## Open questions

- When should a team workspace become visible to a new member?
- Which operations belong to the owner, and which belong to an admin?
- How do we explain that a workspace is bound to one computer without making the UI feel like a device manager?`,
  },
  {
    name: 'notes',
    path: '/notes',
    type: 'folder',
    updated: '12 分钟前',
  },
  {
    name: 'brief.md',
    path: '/notes/brief.md',
    type: 'file',
    size: '3.8 KB',
    updated: '12 分钟前',
    language: 'markdown',
    content: `# Brief

Workspaces are file and data containers attached to one computer. The list is cross-device, but the files live on the machine that owns the workspace.

The first prototype should make ownership, scope, and access legible at a glance.`,
  },
  {
    name: 'interview-01.md',
    path: '/notes/interview-01.md',
    type: 'file',
    size: '5.6 KB',
    updated: '昨天',
    language: 'markdown',
    content: `# Interview 01

The participant described the workspace as "the place where the agent can actually do something".

They expected the workspace list to show which computer it belongs to, and whether another person can open it. They did not want to think about nodes or mounts.`,
  },
  {
    name: 'data',
    path: '/data',
    type: 'folder',
    updated: '昨天',
  },
  {
    name: 'sources.csv',
    path: '/data/sources.csv',
    type: 'file',
    size: '22 KB',
    updated: '昨天',
    language: 'csv',
    content: `name,type,owner
Research Notes,workspace,wren
Brand Launch,workspace,team
Design System,workspace,team`,
  },
  {
    name: 'assets',
    path: '/assets',
    type: 'folder',
    updated: '2 天前',
  },
  {
    name: 'chart.png',
    path: '/assets/chart.png',
    type: 'file',
    size: '380 KB',
    updated: '2 天前',
  },
]

const designFiles: WorkspaceFile[] = [
  {
    name: 'README.md',
    path: '/README.md',
    type: 'file',
    size: '3.1 KB',
    updated: '3 小时前',
    language: 'markdown',
    content: `# Design System

Read-only reference for product teams.

## Foundations

- Type scale
- Spacing scale
- Color roles
- Control states

Use the tokens from the foundation package. Do not add a local color value to a component.`,
  },
  {
    name: 'tokens',
    path: '/tokens',
    type: 'folder',
    updated: '3 小时前',
  },
  {
    name: 'color.md',
    path: '/tokens/color.md',
    type: 'file',
    size: '8.8 KB',
    updated: '3 小时前',
    language: 'markdown',
    content: `# Color roles

Every color in the product comes from a role token. Components consume roles, not raw values.

## Surfaces

- background-app
- background-surface
- background-field
- background-hover

## Text

- text-primary
- text-secondary
- text-tertiary
- text-inverse`,
  },
  {
    name: 'components',
    path: '/components',
    type: 'folder',
    updated: '昨天',
  },
  {
    name: 'button.md',
    path: '/components/button.md',
    type: 'file',
    size: '4.4 KB',
    updated: '昨天',
    language: 'markdown',
    content: `# Button

Buttons use the shared control height and radius. A primary action uses the brand role. A secondary action uses the control border and surface roles.

Disabled actions must explain why they are disabled.`,
  },
]

const automationFiles: WorkspaceFile[] = [
  {
    name: 'README.md',
    path: '/README.md',
    type: 'file',
    size: '900 B',
    updated: '昨天',
    language: 'markdown',
    content: `# Automation Lab

Scripts and logs for the nightly workspace checks.`,
  },
  {
    name: 'scripts',
    path: '/scripts',
    type: 'folder',
    updated: '昨天',
    git: { branch: 'main', changes: 0 },
  },
  {
    name: 'run.sh',
    path: '/scripts/run.sh',
    type: 'file',
    size: '1.4 KB',
    updated: '昨天',
    language: 'shell',
    content: `#!/usr/bin/env bash
set -euo pipefail

pnpm lint
pnpm check
pnpm test`,
  },
  {
    name: 'logs',
    path: '/logs',
    type: 'folder',
    updated: '昨天',
  },
  {
    name: 'latest.log',
    path: '/logs/latest.log',
    type: 'file',
    size: '12 KB',
    updated: '昨天',
    language: 'text',
    content: `[10:03:27] lint: ok
[10:03:29] check: ok
[10:03:31] test: 121 files / 825 examples`,
  },
]

export const workspaceSeed: Workspace[] = [
  {
    id: 'research-notes',
    name: 'Research Notes',
    description: 'Workspace model interviews and open questions.',
    scope: 'private',
    computerId: 'mac-studio',
    computerName: 'Mac Studio · 研究机',
    computerOs: 'macOS 15.1',
    role: 'owner',
    createdAt: '2026-10-02',
    updatedAt: '12 分钟前',
    files: researchFiles,
    members: [],
    apps: [
      {
        id: 'research-digest',
        name: 'Research Digest',
        description: 'Turns interview notes into a weekly digest.',
        domain: '/notes',
        icon: 'i-book',
        tone: 'brand',
      },
    ],
  },
  {
    id: 'brand-launch',
    name: 'Brand Launch',
    description: 'Spring campaign brief, key visual, and launch copy.',
    scope: 'team',
    computerId: 'mac-studio',
    computerName: 'Mac Studio · 研究机',
    computerOs: 'macOS 15.1',
    role: 'admin',
    createdAt: '2026-09-18',
    updatedAt: '1 小时前',
    files: sharedFiles,
    members: [
      { id: 'emma', name: 'Emma Lin', email: 'emma@yaoagents.com', role: 'owner' },
      { id: 'wren', name: 'Wren', email: 'wren@yaoagents.com', role: 'admin' },
      { id: 'lin', name: 'Lin Chen', email: 'lin@yaoagents.com', role: 'editor' },
      { id: 'kai', name: 'Kai Wu', email: 'kai@yaoagents.com', role: 'viewer' },
    ],
    apps: [
      {
        id: 'poster-studio',
        name: 'Poster Studio',
        description: 'Generates campaign key visuals from a short brief.',
        domain: '/campaigns',
        icon: 'i-obj-artifact',
        tone: 'warning',
      },
      {
        id: 'landing-builder',
        name: 'Landing Builder',
        description: 'Builds the launch page from the copy deck.',
        domain: '/',
        icon: 'i-apps',
        tone: 'brand',
      },
    ],
  },
  {
    id: 'design-system',
    name: 'Design System',
    description: 'Shared foundation tokens and component references.',
    scope: 'team',
    computerId: 'macbook-pro',
    computerName: 'Wren 的 MacBook Pro',
    computerOs: 'macOS 15.1',
    role: 'viewer',
    createdAt: '2026-08-22',
    updatedAt: '3 小时前',
    files: designFiles,
    members: [
      { id: 'emma', name: 'Emma Lin', email: 'emma@yaoagents.com', role: 'owner' },
      { id: 'wren', name: 'Wren', email: 'wren@yaoagents.com', role: 'viewer' },
      { id: 'lin', name: 'Lin Chen', email: 'lin@yaoagents.com', role: 'editor' },
      { id: 'noah', name: 'Noah Park', email: 'noah@yaoagents.com', role: 'viewer' },
    ],
    apps: [
      {
        id: 'component-catalog',
        name: 'Component Catalog',
        description: 'Renders the component reference from the token files.',
        domain: '/components',
        icon: 'i-obj-sandbox',
        tone: 'success',
      },
    ],
  },
  {
    id: 'automation-lab',
    name: 'Automation Lab',
    description: 'Nightly checks and maintenance scripts.',
    scope: 'private',
    computerId: 'linux-build',
    computerName: 'Linux 构建机',
    computerOs: 'Ubuntu 24.04',
    role: 'owner',
    createdAt: '2026-10-12',
    updatedAt: '昨天',
    files: automationFiles,
    members: [],
    apps: [
      {
        id: 'nightly-check',
        name: 'Nightly Check',
        description: 'Runs the workspace checks and writes a log.',
        domain: '/scripts',
        icon: 'i-file-terminal',
        tone: 'success',
      },
    ],
  },
]

export function fileKind(file: WorkspaceFile): 'folder' | 'markdown' | 'image' | 'code' | 'data' | 'text' {
  if (file.type === 'folder') return 'folder'
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'md') return 'markdown'
  if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext || '')) return 'image'
  if (['ts', 'tsx', 'js', 'sh', 'go', 'py'].includes(ext || '')) return 'code'
  if (['csv', 'json'].includes(ext || '')) return 'data'
  return 'text'
}

export function fileIcon(file: WorkspaceFile): IconId {
  const kind = fileKind(file)
  if (kind === 'folder') return 'i-folder'
  if (kind === 'image') return 'i-file-image'
  if (kind === 'code') return 'i-file-code'
  if (kind === 'data') return 'i-file-sheet'
  if (kind === 'markdown') return 'i-file-text'
  return 'i-file'
}

export function childrenOf(files: WorkspaceFile[], path: string): WorkspaceFile[] {
  const prefix = path === '/' ? '/' : `${path}/`
  return files.filter((file) => {
    if (!file.path.startsWith(prefix)) return false
    return !file.path.slice(prefix.length).includes('/')
  })
}

export function readWorkspace(workspaces: Workspace[], id?: string): Workspace | undefined {
  return workspaces.find((workspace) => workspace.id === id)
}
