#!/usr/bin/env node
/**
 * check-css-conventions.mjs — 检查 CONVENTIONS.md 里"能静态查"的几条
 *
 * 现在查一条（最容易事后返工、且无需构建工具的那条）：
 *   布局只用逻辑属性（margin-inline-start / inset-inline-start / text-align:start / border-inline-*）
 *   物理方向属性（margin-left / left: / text-align:left …）一律不该出现在产品代码里
 *
 * 为什么是这一条：事前几乎免费，事后要动全站布局。见 ../CONVENTIONS.md §3。
 *
 * 豁免（两种，都会打印出来，不藏）：
 *   1. 存量文件：三张规范页是演示稿，按约定不回改 —— 记为"已知存量"，不阻塞
 *   2. 行内标记：文件里写明 `css-conventions: allow-physical` 的段落（如反例演示）
 *
 * 用法：node check-css-conventions.mjs
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

/* 本脚本住在 scripts/，目标资产在 ../design/ —— 统一切到那里作为工作目录，
   这样下面所有相对路径（icons/… · *.html · tokens.less · i18n/…）都继续成立，
   并且从任何目录调用都不会出错。 */
const DESIGN = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'design')
process.chdir(DESIGN)
/* 可选：第一个参数指定目标目录（测试用），默认 ../design */
const TARGET = resolve(process.argv[2] || DESIGN)
process.chdir(TARGET)



const dir = TARGET

/**
 * 存量豁免：这几张是**演示稿**，按约定不回改（见 CONVENTIONS.md §3 现状一段）。
 * 它们里的物理属性只登记、不打印细节、不阻塞 —— 这条规矩约束的是**产品代码**。
 */
const LEGACY = new Set([
  'icons.html', 'index.html', 'mock.html', 'color-card.html', 'foundations.html',
])

/** 行内豁免标记 */
const MARKER = 'css-conventions: allow-physical'

/** 物理方向属性 → 建议的逻辑写法 */
const PHYSICAL = [
  [/\bmargin-left\s*:/g, 'margin-inline-start'],
  [/\bmargin-right\s*:/g, 'margin-inline-end'],
  [/\bpadding-left\s*:/g, 'padding-inline-start'],
  [/\bpadding-right\s*:/g, 'padding-inline-end'],
  /* 注意：left/right 前面不能是 `-` 或字母，否则 padding-right / margin-left 会被重复报两次 */
  [/(?<![-\w])left\s*:/g, 'inset-inline-start'],
  [/(?<![-\w])right\s*:/g, 'inset-inline-end'],
  [/\btext-align\s*:\s*(left|right)\b/g, 'text-align: start / end'],
  [/\bborder-left\b/g, 'border-inline-start'],
  [/\bborder-right\b/g, 'border-inline-end'],
  [/\bborder-(top|bottom)-(left|right)-radius\b/g, 'border-start-start-radius and friends'],
]

/** 取页面里的 <style> 段落 + 独立样式文件全文；返回 [{ lines, exempt }] */
function styleBlocks(file, text) {
  if (file.endsWith('.less') || file.endsWith('.css')) {
    return [{ lines: text.split('\n'), exempt: text.includes(MARKER) }]
  }
  const out = []
  const re = /<style[^>]*>([\s\S]*?)<\/style>/g
  let m
  while ((m = re.exec(text))) {
    out.push({ lines: m[1].split('\n'), exempt: m[1].includes(MARKER) })
  }
  return out
}

const files = readdirSync(dir)
  .filter((f) => f.endsWith('.html') || f === 'tokens.less' || f === 'tokens.css')
  .sort()

let problems = []
const legacyHits = []

for (const file of files) {
  const text = readFileSync(resolve(dir, file), 'utf8')
  const isLegacy = LEGACY.has(file)
  for (const block of styleBlocks(file, text)) {
    if (block.exempt) continue
    block.lines.forEach((line, i) => {
      if (line.trim().startsWith('*') || line.trim().startsWith('/*')) return   // 注释行不算
      for (const [re, suggest] of PHYSICAL) {
        re.lastIndex = 0
        if (re.test(line)) {
          const hit = { file, line: i + 1, text: line.trim().slice(0, 72), suggest }
          ;(isLegacy ? legacyHits : problems).push(hit)
        }
      }
    })
  }
}

if (files.length === 0) {
  console.log('✗ no files to check — wrong target directory? (target: ' + dir + ')')
  process.exit(1)
}

if (legacyHits.length) {
  const files = [...new Set(legacyHits.map((h) => h.file))].sort().join(' · ')
  console.log(`  · ${legacyHits.length} known legacy hit(s), all in the demo pages: ${files} (left alone by agreement)`)
}

if (problems.length) {
  console.log(`✗ CONVENTIONS.md §3 "layout uses logical properties only" has ${problems.length} violation(s):`)
  for (const p of problems) {
    console.log(`   ${p.file}:${p.line}  ${p.text}`)
    console.log(`       → use ${p.suggest}`)
  }
  process.exit(1)
}

console.log('  ✓ outside the known demo pages there are no physical direction properties (logical layout only)')
