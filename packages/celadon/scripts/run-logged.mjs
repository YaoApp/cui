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
/* 每一步的墙钟上限（秒）。**为什么需要它**：同步死循环会把事件循环占死，
   连测试框架自己的超时都拦不住（同步代码不让出事件循环），于是 CI 挂到天荒地老还看不到原因。
   进程外的看门狗是唯一拦得住它的东西。0 = 不限。 */
const STEP_TIMEOUT = Number(process.env.CUI_STEP_TIMEOUT ?? 300)
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
  console.error('usage: node scripts/run-logged.mjs <log name> <command> [args...]')
  process.exit(2)
}

const startedAt = new Date()
const dayDir = resolve(LOGS, localDate(startedAt))
mkdirSync(dayDir, { recursive: true })

const file = `${name}-${localMinute(startedAt)}.log`
const relativeLog = `app/logs/${localDate(startedAt)}/${file}`
const out = createWriteStream(resolve(dayDir, file), { flags: 'w' })
const write = (chunk) => { process.stdout.write(chunk); out.write(chunk) }

out.write(
  `# command ${command} ${args.join(' ')}\n# started ${localStamp(startedAt)}` +
    `${STEP_TIMEOUT > 0 ? `\n# step timeout ${STEP_TIMEOUT}s (CUI_STEP_TIMEOUT)` : ''}\n\n`,
)

const pruned = pruneOldDays(startedAt)
if (pruned) console.log(`  pruned ${pruned} log director(y|ies) older than ${KEEP_DAYS} days`)

/* 独立进程组：超时要杀的是**整棵树**（vitest · chrome 都是孙进程）。
   只杀直接子进程的话，看门狗报超时了，孙进程还在占 CPU（2026-10-03 复核者指出）。 */
const detached = process.platform !== 'win32'
const child = spawn(command, args, { cwd: PACKAGE, stdio: ['inherit', 'pipe', 'pipe'], detached })
const killTree = (signal) => {
  try {
    if (detached && child.pid) process.kill(-child.pid, signal)
    else child.kill(signal)
  } catch {
    /* 已经退出 */
  }
}
let timedOut = false
const watchdog =
  STEP_TIMEOUT > 0 ? setTimeout(() => { timedOut = true; killTree('SIGKILL') }, STEP_TIMEOUT * 1000) : null

/* 起不来（如可执行文件不存在）时也要收尾：否则日志没有 footer、流也不关。 */
child.on('error', (error) => {
  if (watchdog) clearTimeout(watchdog)
  out.write(`\n# failed to start: ${error.message}\n`)
  out.end(() => {
    console.error(`  failed to start: ${error.message}`)
    process.exit(1)
  })
})

child.stdout.on('data', write)
child.stderr.on('data', write)

child.on('close', (code) => {
  if (watchdog) clearTimeout(watchdog)
  const endedAt = new Date()
  const seconds = ((endedAt.getTime() - startedAt.getTime()) / 1000).toFixed(1)
  const exit = timedOut ? 124 : (code ?? 1)
  const footer = `\n# finished ${localStamp(endedAt)} · exit ${exit} · ${seconds}s${timedOut ? ` · ABORTED after ${STEP_TIMEOUT}s` : ''}\n`
  out.write(footer)
  if (timedOut) {
    out.write(
      '# 超过墙钟上限被中止。同步死循环会占死事件循环，用例自身的超时拦不住它 ——\n' +
        '# 排查步骤见 architecture/14-testing.md 的「卡住怎么办」。\n',
    )
  }
  out.end(() => {
    process.stdout.write(footer)
    console.log(`  log: ${relativeLog}`)
    process.exit(exit)
  })
})
