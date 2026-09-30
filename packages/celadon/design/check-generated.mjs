#!/usr/bin/env node
/* 生成物一致性检查：icons.html / mock.html 由 build-icons.mjs 从 icons/*.svg + manifest 生成。
   曾经出现"改了 own-sprite.svg 但忘了重跑，页面里还是旧副本"的问题，这里把它变成可检查的：
   跑一遍 build-icons.mjs，如果产物有变化，就说明仓库里的生成物是旧的。 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const GENERATED = ['icons.html', 'mock.html'];   /* build-icons.mjs 的产物 */
const files = ['icons.html', 'mock.html', 'index.html'];   /* 颜色类检查覆盖三张规范页 */
const before = GENERATED.map((f) => readFileSync(f, 'utf8'));
execFileSync('node', ['build-icons.mjs'], { stdio: 'pipe' });
const stale = GENERATED.filter((f, i) => readFileSync(f, 'utf8') !== before[i]);
if (stale.length) {
  console.log(`  ✗ 生成物是旧的：${stale.join(', ')} —— 请把 build-icons.mjs 的结果一并提交`);
  process.exit(1);
}
console.log('  ✓ 生成物与源一致（icons.html / mock.html）');
// 品牌标记的颜色只允许来自 token：写死色值会让页面和 token 悄悄脱钩
const hard = ['#2A7B7B', '#389F9F', '#2FA79C', '#0CC8B7', '#F4F1EA', '#FFFFFF'];
let dirty = [];
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  for (const c of hard) if (text.includes('fill="' + c + '"') || text.includes('fill:' + c) || text.includes('stop-color="' + c + '"')) dirty.push(`${f}: ${c}`);
}
if (dirty.length) {
  console.log(`  ✗ 品牌标记颜色写死了：${dirty.slice(0, 4).join(', ')} —— 请改用 --brand-mark-* / --brand-eye`);
  process.exit(1);
}
// 标记的填充只允许 --brand-eye / --brand-mark-*：用 UI 的 --brand-text / --brand-graphic / --brand-lift
// 会让标记跟着 UI 主题走，正是要避免的。历史：眼睛写过 --brand-text，结果一直是刺眼的纯白，
// 而且 index.html 一度不在检查范围内，所以注入了也报不出来。
const WRONG = ['--brand-text', '--brand-graphic', '--brand-lift'];
let wrongUse = [];
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  for (const w of WRONG) {
    let i = text.indexOf(w);
    while (i !== -1) {
      const ctx = text.slice(Math.max(0, i - 40), i);   // 看它前面是不是 fill / stop-color
      if (/fill\s*[:=]\s*["']?\s*[^;"']*$/.test(ctx) || /stop-color\s*[:=]\s*["']?$/.test(ctx)) wrongUse.push(`${f}: ${ctx.slice(-24)}${w}`);
      i = text.indexOf(w, i + 1);
    }
  }
}
if (wrongUse.length) {
  console.log(`  ✗ 用 UI 的品牌 token 给标记上色：${wrongUse.slice(0, 3).join(' · ')}`);
  console.log('      请改用 --brand-mark-from/to 与 --brand-eye');
  process.exit(1);
}
console.log('  ✓ 品牌标记颜色全部来自 token');
