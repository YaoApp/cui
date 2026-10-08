#!/usr/bin/env node
/**
 * inputs.mjs — 检查器的目标解析：把命令行参数变成「要走的目录」或「要看的文件」。
 *
 * 三种情形：
 *   · 给目录（或什么都不给）→ 目录模式，走整棵树，报告整棵树的问题（原有行为）；
 *   · 只给文件 → 文件模式，只走这些文件的父目录，只报告这些文件的问题；
 *   · 参数不存在 → 记进 missing，由调用方决定怎么报错。
 *
 * 文件模式下 target 仍是调用方给的默认目录（算相对路径的基准），
 * 因为报告里的路径要对齐包内位置，而不是文件自己的父目录。
 */
import { existsSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export function readTargets(args, { defaultDir }) {
  const missing = []
  const dirs = []
  const files = []
  for (const arg of args) {
    const abs = resolve(arg)
    if (!existsSync(abs)) { missing.push(abs); continue }
    if (statSync(abs).isDirectory()) dirs.push(abs)
    else files.push(abs)
  }
  if (dirs.length) return { roots: dirs, filter: null, target: dirs[0], dirMode: true, missing }
  if (files.length) return { roots: [...new Set(files.map((file) => dirname(file)))], filter: new Set(files), target: defaultDir, dirMode: false, missing }
  return { roots: [defaultDir], filter: null, target: defaultDir, dirMode: true, missing }
}

/** 文件模式下是否该报告这个文件；目录模式下全报。 */
export function reports(filter, file) {
  return !filter || filter.has(file)
}
