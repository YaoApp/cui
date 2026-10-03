#!/usr/bin/env node
/* 样式必须走 token：字号 / 行高 / 圆角 / 颜色 / 间距 / 线宽不许写死。
   检查面两处，同一套规则：
     · design/*.html —— 规范页的 <style> 块（演示稿除外）
     · app/src 下的 .less —— 产品样式（品牌官方色是唯一例外，它在雪碧图里，由 check-generated.mjs 管）
   历史：mock 里曾散着 55 处写死的字号与圆角、index 里 7 处，改了 token 也不会跟着变；
         只看 design 页面时，产品样式里的字面值长期漏检。 */
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';

/* 本脚本住在 scripts/，默认检查这个包的 design/。第一个参数可指定 design 目录（检查器自测用）。
   app 侧与 design 侧同属一个包：包根 = dirname(目标)，app 源码在 <包根>/app/src ——
   真实运行 TARGET = <包根>/design，测试样本把 design/ 与 app/src/ 放进同一个用例目录，形状与真实一致。 */
const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DESIGN = join(PACKAGE, 'design');
const TARGET = resolve(process.argv[2] || DESIGN);
/* 目标所属的包根：真实运行是 <包根>/design 的上一层，测试样本是放了 design/ 与 app/src/ 的用例根。 */
const ROOT = dirname(TARGET);
const APP_SRC = join(ROOT, 'app', 'src');

/* 存量：这几张是演示稿，按约定不回改（CONVENTIONS §3）。
   其余 *.html 一律纳入检查 —— 新页面默认被查，不用手工登记。 */
const LEGACY = new Set(['color-card.html', 'foundations.html']);
/* 明文例外：
   · 品牌官方色 —— 不在页面的 <style> 里，而在雪碧图中（check-generated.mjs 管）
   · macOS 红黄绿灯与窗底 —— 系统再现，不是我们的设计决策，改了反而不像系统
   · 几何值（50% / 100% / 0）与关键字 */
const ALLOW = new Set(['transparent', 'none', 'inherit', 'currentColor', '50%', '100%', '0', 'auto',
  '#FF5F57', '#FEBC2E', '#28C840', '#0B0B0B']);

/* 取数：design 侧取页面 <style> 块，app 侧取 .less 原文，两边都先剥注释。
   四条规则只遍历这里返回的 { file, css }，不再各自重复。 */
function sources() {
  const out = [];
  /* 剥注释：块注释 + Less 的**整行** `//` 注释（行首可选空白后紧跟 `//`）。
     只剥整行，是为了不误伤 `content: "//"` 与 `url(//cdn…)`；行尾注释不剥（宁可漏剥，不可误报）。 */
  const strip = (css) => css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '');
  if (existsSync(TARGET) && statSync(TARGET).isDirectory()) {
    const pages = readdirSync(TARGET).filter((f) => f.endsWith('.html') && !LEGACY.has(f)).sort();
    for (const f of pages) {
      const html = readFileSync(join(TARGET, f), 'utf8');
      out.push({ file: f, css: strip([...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')) });
    }
  }
  const walk = (dir) => {
    if (!existsSync(dir) || !statSync(dir).isDirectory()) return;
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.name.endsWith('.less')) continue;
      out.push({ file: relative(ROOT, full), css: strip(readFileSync(full, 'utf8')) });
    }
  };
  walk(APP_SRC);
  return out;
}

const SOURCES = sources();
if (SOURCES.length === 0) {
  console.log('✗ nothing to check — no design/*.html and no app/src/**/*.less (target: ' + TARGET + ')');
  process.exit(1);
}
let bad = [];
for (const { file: f, css } of SOURCES) {
  for (const m of css.matchAll(/([-a-z]+)\s*:\s*([^;{}]+)(?=;|\})/g)) {   /* 注意：matchAll 的第 0 项是整个匹配，不能用 [prop, val] 解构；
   另外最后一条声明通常没有分号，所以用前瞻 (?=;|}) 而不是要求分号 */
    const prop = m[1], v = m[2].trim();
    if (ALLOW.has(v)) continue;
    if (v.includes('var(')) continue;                       // 走 token 的一律放行
    const colour = /#[0-9A-Fa-f]{3,8}\b|\brgba?\(|\bhsla?\(/.test(v);
    const sizeLiteral = /^\d+(\.\d+)?(px|rem|em)$/.test(v) && ['font-size', 'border-radius', 'box-shadow'].includes(prop);
    if (colour || sizeLiteral) bad.push(`${f}: ${prop}: ${v}`);   // 规范原话：禁止**任何**颜色字面量
  }
}
// §1 装饰色（--text-muted / --text-disabled / --text-placeholder）不能承载文字
const NON_TEXT = ['--text-muted'];   /* 规范只点名 text-muted；disabled/placeholder 本就是给文字用的 */
for (const { file: f, css } of SOURCES) {
  for (const m of css.matchAll(/([-a-z]+)\s*:\s*([^;{}]+)(?=;|\})/g)) {
    if (!/^color$|text-fill-color$/.test(m[1].trim())) continue;
    const v = m[2].trim();
    for (const t of NON_TEXT) if (v.includes(t)) bad.push(`${f}: ${m[1].trim()}: ${v}(${t} is a decorative colour and may not carry text)`);
  }
}
// §3 四值简写的 inline 两侧不对称 —— RTL 下会错位（margin: 0 0 0 auto 就是典型）
const DIRECTIONAL4 = /^(margin|padding|inset|border-width|border-color|border-style)$/;
for (const { file: f, css } of SOURCES) {
  for (const m of css.matchAll(/([-a-z]+)\s*:\s*([^;{}]+)(?=;|\})/g)) {
    const prop = m[1].trim(), v = m[2].trim();
    if (!DIRECTIONAL4.test(prop) || v.includes('var(')) continue;
    const parts = v.split(/\s+/).filter((x) => x && !x.startsWith('calc('));
    if (parts.length < 3) continue;                        // 1–2 值天然对称
    const second = parts[1], fourth = parts[parts.length === 3 ? 1 : 3];
    if (parts.length === 3 ? second !== fourth : second !== fourth) {
      bad.push(`${f}: ${prop}: ${v}(the inline sides are asymmetric, which breaks in RTL — use *-inline-start/end)`);
    }
  }
}
// 语法完整性：大括号配对 + 规则体内一条声明只能有一个冒号（多出来就是漏了分号，
// 浏览器会静默丢弃整条声明 —— 曾经把 .toolbar 的 margin-bottom 吃掉，工具条就贴上了界面）
for (const { file: f, css } of SOURCES) {
  if ((css.match(/\{/g) || []).length !== (css.match(/\}/g) || []).length) bad.push(`${f}: unbalanced braces`);
  for (const rule of css.matchAll(/\{([^{}]*)\}/g)) {
    for (const decl of rule[1].split(';')) {
      const d = decl.trim();
      if (!d || /url\(|data:/i.test(d)) continue;
      if ((d.match(/:/g) || []).length > 1) bad.push(`${f}: probably a missing semicolon — ${d.slice(0, 46)}`);
    }
  }
}
// 行高必须走 token（--line-height-normal 拉丁 / --line-height-cjk 中日文）；
// font 简写里的 /1.5 会绕过 token，一并拦下
for (const { file: f, css } of SOURCES) {
  for (const m of css.matchAll(/([-a-z]+)\s*:\s*([^;{}]+)(?=;|\})/g)) {
    const prop = m[1], v = m[2].trim();
    if (prop === 'line-height' && !v.startsWith('var(--line-height-') && !['normal', 'inherit', '0'].includes(v)) {
      bad.push(`${f}: line-height: ${v} (must come from --line-height-*)`);
    }
    if (prop === 'font' && /\d+(\.\d+)?(px|rem|em)/.test(v)) {
      bad.push(`${f}: the font shorthand hardcodes size or line height (${v.slice(0, 34)}) — split it into font-family/size/weight/line-height and use tokens`);
    } else if (prop === 'font' && /\//.test(v)) {
      bad.push(`${f}: the font shorthand hardcodes the line height (${v.slice(0, 30)}) — use font plus line-height: var(--line-height-*)`);
    }
  }
}
// 间距与线宽同样必须走 token：--spacing-* / --border-width
const SPACING = /^(padding|margin|gap)(-top|-right|-bottom|-left)?$|^(row-gap|column-gap)$/;
const BORDER = /^border(-top|-right|-bottom|-left|-inline-start|-inline-end|-block-start|-block-end)?$/;
for (const { file: f, css } of SOURCES) {
  for (const m of css.matchAll(/([-a-z]+)\s*:\s*([^;{}]+)(?=;|\})/g)) {
    const prop = m[1], v = m[2].trim();
    if (SPACING.test(prop) && /\b[\d.]+(px|rem|em)\b/.test(v)) bad.push(`${f}: ${prop}: ${v} (spacing must come from --spacing-*)`);
    if (BORDER.test(prop) && /\b[\d.]+(px|rem|em)\b/.test(v) && !v.includes('var(--border-width)')) bad.push(`${f}: ${prop}: ${v}(border width must come from --border-width)`);
  }
}
if (bad.length) {
  console.log(`  ✗ ${bad.length} hardcoded value(s) that should come from a token:`);
  bad.slice(0, 8).forEach((b) => console.log('      ' + b));
  process.exit(1);
}
console.log('  ✓ font size, line height, radius, colour, spacing and border width all come from tokens');
