#!/usr/bin/env node
/* 生成物一致性检查：icons.html / mock.html 由 build-icons.mjs 从 icons/*.svg + manifest 生成。
   曾经出现"改了 own-sprite.svg 但忘了重跑，页面里还是旧副本"的问题，这里把它变成可检查的：
   跑一遍 build-icons.mjs，如果产物有变化，就说明仓库里的生成物是旧的。 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const files = ['icons.html', 'mock.html'];
const before = files.map((f) => readFileSync(f, 'utf8'));
execFileSync('node', ['build-icons.mjs'], { stdio: 'pipe' });
const stale = files.filter((f, i) => readFileSync(f, 'utf8') !== before[i]);
if (stale.length) {
  console.log(`  ✗ 生成物是旧的：${stale.join(', ')} —— 请把 build-icons.mjs 的结果一并提交`);
  process.exit(1);
}
console.log('  ✓ 生成物与源一致（icons.html / mock.html）');
