#!/usr/bin/env node
/* 规范页的样式必须走 token：字号 / 圆角 / 颜色不许写死。
   （品牌官方色是唯一例外，它们不在这三张页面的 <style> 里，而在雪碧图中。）
   历史：mock 里曾散着 55 处写死的字号与圆角、index 里 7 处，改了 token 也不会跟着变。 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

/* 本脚本住在 scripts/，目标资产在 ../design/ —— 统一切到那里作为工作目录，
   这样下面所有相对路径（icons/… · *.html · tokens.less · i18n/…）都继续成立，
   并且从任何目录调用都不会出错。 */
const DESIGN = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'design')
process.chdir(DESIGN)

const PAGES = ['icons.html', 'index.html', 'mock.html', 'css-logical.html', 'data-format.html'];
/* 明文例外：
   · 品牌官方色 —— 不在这三张页面的 <style> 里，而在雪碧图中（check-generated.mjs 管）
   · macOS 红黄绿灯与窗底 —— 系统再现，不是我们的设计决策，改了反而不像系统
   · 几何值（50% / 100% / 0）与关键字 */
const ALLOW = new Set(['transparent', 'none', 'inherit', 'currentColor', '50%', '100%', '0', 'auto',
  '#FF5F57', '#FEBC2E', '#28C840', '#0B0B0B']);
let bad = [];
for (const f of PAGES) {
  const css = [...readFileSync(f, 'utf8').matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/([-a-z]+)\s*:\s*([^;{}]+)(?=;|\})/g)) {   /* 注意：matchAll 的第 0 项是整个匹配，不能用 [prop, val] 解构；
   另外最后一条声明通常没有分号，所以用前瞻 (?=;|}) 而不是要求分号 */
    const prop = m[1], v = m[2].trim();
    if (ALLOW.has(v)) continue;
    const literal = /#[0-9A-Fa-f]{3,8}\b|rgba?\(|hsla?\(/.test(v) || (/^\d+(\.\d+)?(px|rem|em)$/.test(v) && ['font-size', 'border-radius', 'box-shadow'].includes(prop));
    if (!literal) continue;
    if (['font-size', 'border-radius', 'box-shadow', 'background', 'background-color', 'color', 'border', 'border-color'].includes(prop) && !v.includes('var(')) {
      bad.push(`${f}: ${prop}: ${v}`);
    }
  }
}
// 语法完整性：大括号配对 + 规则体内一条声明只能有一个冒号（多出来就是漏了分号，
// 浏览器会静默丢弃整条声明 —— 曾经把 .toolbar 的 margin-bottom 吃掉，工具条就贴上了界面）
for (const f of PAGES) {
  const css = [...readFileSync(f, 'utf8').matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
  if ((css.match(/\{/g) || []).length !== (css.match(/\}/g) || []).length) bad.push(`${f}: 大括号不配对`);
  for (const rule of css.matchAll(/\{([^{}]*)\}/g)) {
    for (const decl of rule[1].split(';')) {
      const d = decl.trim();
      if (!d || /url\(|data:/i.test(d)) continue;
      if ((d.match(/:/g) || []).length > 1) bad.push(`${f}: 疑似漏分号 —— ${d.slice(0, 46)}`);
    }
  }
}
// 行高必须走 token（--line-height-normal 拉丁 / --line-height-cjk 中日文）；
// font 简写里的 /1.5 会绕过 token，一并拦下
for (const f of PAGES) {
  const css = [...readFileSync(f, 'utf8').matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/([-a-z]+)\s*:\s*([^;{}]+)(?=;|\})/g)) {
    const prop = m[1], v = m[2].trim();
    if (prop === 'line-height' && !v.startsWith('var(--line-height-') && !['normal', 'inherit', '0'].includes(v)) {
      bad.push(`${f}: line-height: ${v}（应走 --line-height-*）`);
    }
    if (prop === 'font' && /\d+(\.\d+)?(px|rem|em)/.test(v)) {
      bad.push(`${f}: font 简写里写死了字号/行高（${v.slice(0, 34)}）—— 拆成 font-family/size/weight/line-height 走 token`);
    } else if (prop === 'font' && /\//.test(v)) {
      bad.push(`${f}: font 简写里写死了行高（${v.slice(0, 30)}）—— 拆成 font + line-height: var(--line-height-*)`);
    }
  }
}
// 间距与线宽同样必须走 token：--spacing-* / --border-width
const SPACING = /^(padding|margin|gap)(-top|-right|-bottom|-left)?$|^(row-gap|column-gap)$/;
const BORDER = /^border(-top|-right|-bottom|-left)?$/;
for (const f of PAGES) {
  const css = [...readFileSync(f, 'utf8').matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/([-a-z]+)\s*:\s*([^;{}]+)(?=;|\})/g)) {
    const prop = m[1], v = m[2].trim();
    if (SPACING.test(prop) && /\b[\d.]+(px|rem|em)\b/.test(v)) bad.push(`${f}: ${prop}: ${v}（间距应走 --spacing-*）`);
    if (BORDER.test(prop) && /\b[\d.]+(px|rem|em)\b/.test(v) && !v.includes('var(--border-width)')) bad.push(`${f}: ${prop}: ${v}（线宽应走 --border-width）`);
  }
}
if (bad.length) {
  console.log(`  ✗ ${bad.length} 处写死（应改走 token）：`);
  bad.slice(0, 8).forEach((b) => console.log('      ' + b));
  process.exit(1);
}
console.log('  ✓ 规范页与展示页的字号 / 行高 / 圆角 / 颜色 / 间距 / 线宽全部走 token');
