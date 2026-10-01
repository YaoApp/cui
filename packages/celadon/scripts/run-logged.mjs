#!/usr/bin/env node
/* 跑一条命令，输出同时打到屏幕与 app/logs/<本地日期>/<文件名>-<HHMM>.log，并原样透传退出码。
   用法：node scripts/run-logged.mjs <日志名> <命令> [参数...]

   · 用**系统时间**分目录、取时分，不做时区换算 —— 开发者侧日志，他自己知道几点。
   · 文件名带**本地时分**（精确到分钟），同一天多次运行不再互相覆盖。
   · 顺带清理超过保留天数的旧日期目录（CUI_LOG_KEEP_DAYS，默认 14）。 */
import { spawn } from 'node:child_process'
import { createWriteStream, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LOGS = resolve(PACKAGE, 'app', 'logs')
const KEEP_DAYS = Number(process.env.CUI_LOG_KEEP_DAYS ?? 14)
const DAY_DIR = /^\d{4}-\d{2}-\d{2}$/

const pad = (n) => String(n).padStart(2, '0')
const localDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const localMinute = (d) => `${pad(d.getHours())}${pad(d.getMinutes())}`
const localStamp = (d) => `${localDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
/** 删掉超过保留天数的日期目录。只认 YYYY-MM-DD 形状的目录，别的一概不碰。 */
function pruneOldDays(now) {
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - KEEP_DAYS).getTime()
  let removed = 0
  try {
    for (const name of readdirSync(LOGS)) {
      if (!DAY_DIR.test(name)) continue
      const dir = join(LOGS, name)
      try {
        if (!statSync(dir).isDirectory()) continue
        if (new Date(`${name}T00:00:00`).getTime() < cutoff) { rmSync(dir, { recursive: true, force: true }); removed++ }
      } catch { /* 忽略：日志清理不该让测试失败 */ }
    }
  } catch { /* logs 目录还不存在 */ }
  return removed
}

const [name, command, ...args] = process.argv.slice(2)
if (!name || !command) {
  console.error('用法：node scripts/run-logged.mjs <日志名> <命令> [参数...]')
  process.exit(2)
}

const startedAt = new Date()
const dayDir = resolve(LOGS, localDate(startedAt))
mkdirSync(dayDir, { recursive: true })

const file = `${name}-${localMinute(startedAt)}.log`
const relativeLog = `app/logs/${localDate(startedAt)}/${file}`
const out = createWriteStream(resolve(dayDir, file), { flags: 'w' })
const write = (chunk) => { process.stdout.write(chunk); out.write(chunk) }

out.write(`# 命令 ${command} ${args.join(' ')}\n# 开始 ${localStamp(startedAt)}\n\n`)

const pruned = pruneOldDays(startedAt)
if (pruned) console.log(`  已清理 ${pruned} 个超过 ${KEEP_DAYS} 天的日志目录`)

const child = spawn(command, args, { cwd: PACKAGE, stdio: ['inherit', 'pipe', 'pipe'] })
child.stdout.on('data', write)
child.stderr.on('data', write)

child.on('close', (code) => {
  const endedAt = new Date()
  const seconds = ((endedAt.getTime() - startedAt.getTime()) / 1000).toFixed(1)
  const footer = `\n# 结束 ${localStamp(endedAt)} · 退出码 ${code} · 用时 ${seconds}s\n`
  out.write(footer)
  out.end(() => {
    process.stdout.write(footer)
    console.log(`  日志：${relativeLog}`)
    process.exit(code ?? 1)
  })
})
