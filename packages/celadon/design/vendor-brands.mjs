#!/usr/bin/env node
/* 把 @lobehub/icons（MIT）里的第三方品牌 logo 转成我们的标准图标格式。
   做法：真正把每个组件渲染一遍（react-dom/server），拿到的就是最终 SVG——
   不靠正则猜编译产物，因此 <defs>/<clipPath>/<linearGradient> 这些依赖不会丢。
   产出 icons/brand-sprite.svg（独立雪碧图，外部引用，不内联）+ icons/brand-index.json。
   用法：node vendor-brands.mjs
   注意：logo 商标权归各品牌方，仅用于标识对应模型；版权见 THIRD-PARTY-NOTICES。 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, existsSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const VERSION = '5.21.0';
const ALIAS = {
  OpenAI: 'openai', Anthropic: 'anthropic', Claude: 'claude', Google: 'google', Gemini: 'gemini',
  DeepSeek: 'deepseek', XAI: 'xai', Grok: 'grok', Meta: 'meta', Llama: 'llama', Mistral: 'mistral',
  Qwen: 'qwen', Doubao: 'doubao', Moonshot: 'moonshot', Zhipu: 'zhipu', Cohere: 'cohere',
  Perplexity: 'perplexity', Groq: 'groq', Ollama: 'ollama', HuggingFace: 'huggingface',
  Stability: 'stability', Midjourney: 'midjourney', Runway: 'runway', Luma: 'luma', Kling: 'kling',
  Flux: 'flux', Ideogram: 'ideogram', Azure: 'azure', Bedrock: 'bedrock', VertexAI: 'vertex-ai',
  GitHub: 'github', X: 'x', GoogleCloud: 'google-cloud', Microsoft: 'microsoft', AWS: 'aws',
  OpenRouter: 'openrouter', Together: 'together', Fireworks: 'fireworks', Replicate: 'replicate',
  Cerebras: 'cerebras', SambaNova: 'sambanova', Novita: 'novita', SiliconFlow: 'siliconflow',
};
const slug = (b) => 'brand-' + (ALIAS[b] || b
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-'));

/* ---- 准备：下载 + 补相对导入的 .js 扩展名（编译产物没写扩展名，Node ESM 不接受） ---- */
const work = mkdtempSync(join(tmpdir(), 'lobeicons-'));
process.stdout.write(`  准备 @lobehub/icons@${VERSION}（连依赖一起装，组件的 Color 变体会用到 es-toolkit 等）… `);
execFileSync('npm', ['i', '--silent', '--no-audit', '--no-fund', `@lobehub/icons@${VERSION}`, 'react', 'react-dom'], { cwd: work });
const pkg = join(work, 'node_modules', '@lobehub', 'icons');
cpSync(join(pkg, 'es'), join(work, 'es'), { recursive: true });
for (const f of readdirSync(join(work, 'es'), { recursive: true })) {
  const p = join(work, 'es', f);
  if (!p.endsWith('.js') || !existsSync(p)) continue;
  const src = readFileSync(p, 'utf8');
  writeFileSync(p, src.replace(/from\s+"(\.{1,2}\/[^"]+?)"/g, (m, s) => `from "${s.endsWith('.js') ? s : s + '.js'}"`));
}
const require = createRequire(join(work, 'noop.js'));
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
console.log('✓');

const brands = readdirSync(join(work, 'es')).filter((b) => existsSync(join(work, 'es', b, 'components')) && b !== 'index.js');
console.log(`  品牌目录 ${brands.length} 个`);

const render = async (brand, comp) => {
  const mod = await import(join(work, 'es', brand, 'components', comp + '.js'));
  return renderToStaticMarkup(React.createElement(mod.default));
};
/* 输出成我们格式的 symbol 内容：命名空间化 id，mono 强制 currentColor */
function toSymbol(html, sid, mono) {
  const m = html.match(/<svg([^>]*)>([\s\S]*)<\/svg>/);
  if (!m) return null;
  const viewBox = (m[1].match(/viewBox="([^"]+)"/) || [, '0 0 24 24'])[1];
  let inner = m[2].replace(/<!--[\s\S]*?-->/g, '').replace(/\sclass="[^"]*"/g, '').trim();
  for (const id of [...inner.matchAll(/\bid="([^"]+)"/g)].map((x) => x[1])) {
    inner = inner.split(`id="${id}"`).join(`id="${sid}-${id}"`)
      .split(`url(#${id})`).join(`url(#${sid}-${id})`)
      .split(`href="#${id}"`).join(`href="#${sid}-${id}"`);
  }
  if (mono) {
    inner = inner.replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"').replace(/fill:\s*(?!none)[^;"]+/g, 'fill:currentColor');
    // 关键：原组件有大量 path 不带 fill（靠继承），SVG 默认是黑 —— 整组兜底成 currentColor，
    // 子元素自带的 fill 依然优先，所以彩色变体不受影响。
    inner = `<g fill="currentColor">${inner}</g>`;
  }
  // 个别彩色组件整条都不带 fill，同样兜底，避免渲染成默认黑
  if (!mono && !/\bfill=/.test(inner)) inner = `<g fill="currentColor">${inner}</g>`;
  if (!/<(path|circle|rect|ellipse|polygon|line|polyline)/.test(inner)) return null;
  return { viewBox, inner };
}

const symbols = [], symbolOwner = [], index = [], failed = [];   /* symbolOwner: symbols[i] 属于 index 的第几条 */
for (const brand of brands.sort()) {
  const dir = join(work, 'es', brand, 'components');
  const hasColor = existsSync(join(dir, 'Color.js')), hasMono = existsSync(join(dir, 'Mono.js'));
  if (!hasColor && !hasMono) { failed.push(`${brand}: 无 Color/Mono`); continue; }
  const styleFile = join(work, 'es', brand, 'style.js');
  const title = (existsSync(styleFile) ? (readFileSync(styleFile, 'utf8').match(/TITLE\s*=\s*'([^']*)'/) || [])[1] : null) || brand;
  const primary = existsSync(styleFile) ? (readFileSync(styleFile, 'utf8').match(/COLOR_PRIMARY\s*=\s*'([^']+)'/) || [])[1] : null;
  const id = slug(brand);
  // XML 严格：& 与 < 都必须转义，否则整个分片解析失败、坏点之后的符号全部失效
  const xmlEsc = (v) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const attr = `data-title="${xmlEsc(title)}"`;
  let color = null, mono = null;
  // 关键：彩色与 mono 两个符号必须用**各自**的命名空间前缀，
  // 否则组件里 useId 生成的 id（两边相同）会撞车，mask/渐变会解析到错的那个符号
  try { if (hasColor) color = toSymbol(await render(brand, 'Color'), id, false); } catch (e) { failed.push(`${brand}/Color: ${e.message.slice(0, 50)}`); }
  try { if (hasMono) mono = toSymbol(await render(brand, 'Mono'), id + '-mono', true); } catch (e) { failed.push(`${brand}/Mono: ${e.message.slice(0, 50)}`); }
  index.push({ id, brand, title, primary: primary || null, color: !!color, mono: !!mono });
  const owner = index.length - 1;
  const canon = color || mono;
  if (canon) { symbols.push(`  <symbol id="${id}" viewBox="${canon.viewBox}" data-src="lobeicons:${brand}/${color ? 'Color' : 'Mono'}" ${attr}>${canon.inner}</symbol>`); symbolOwner.push(owner); }
  if (color && mono) { symbols.push(`  <symbol id="${id}-mono" viewBox="${mono.viewBox}" data-src="lobeicons:${brand}/Mono" ${attr}>${mono.inner}</symbol>`); symbolOwner.push(owner); }
}
rmSync(work, { recursive: true, force: true });

const sprite = `<!-- Third-party brand logos, rendered from @lobehub/icons ${VERSION} (MIT, (c) 2023 LobeHub).
     The logos are trademarks of their owners and are used only to identify the corresponding models or
     services; do not recolour the colour variants. Regenerate with vendor-brands.mjs. Referenced
     externally (use href="icons/brand-sprite.svg#brand-x"), not inlined into the pages. -->
<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
${symbols.join('\n')}
</defs></svg>
`;
// 分片：Chrome 对外部 use 引用的雪碧图有体积上限（实测 1.1MB 的文件尾部 5% 整体解析失败），
// 所以按累计体积切成多片，每片目标 ~120 KB，并记进 index 供引用。
const SHARD_BYTES = 120 * 1024;
const shards = [[]];
let acc = sprite.slice(0, sprite.indexOf('<symbol')).length;
let lastOwner = -1;
for (const [i, sym] of symbols.entries()) {
  // 按**品牌**切断：同一品牌的彩色与 mono 符号必须同片，否则按品牌记的片号会指空
  const owner = symbolOwner[i];
  if (owner !== lastOwner && acc + sym.length > SHARD_BYTES && shards[shards.length - 1].length) {
    shards.push([]); acc = 0;
  }
  shards[shards.length - 1].push(i);
  acc += sym.length + 1;
  lastOwner = owner;
}
const header = sprite.slice(0, sprite.indexOf('<symbol'));
let shardNo = 0;
for (const group of shards) {
  shardNo += 1;
  const file = `icons/brand-sprite-${shardNo}.svg`;
  writeFileSync(file, `${header}${group.map((i) => symbols[i]).join('\n')}\n</defs></svg>\n`);
  for (const i of group) { const o = symbolOwner[i]; if (index[o]) index[o].shard = shardNo; }
}
for (const f of readdirSync('icons')) {
  const m = f.match(/^brand-sprite-(\d+)\.svg$/);
  if (m && Number(m[1]) > shards.length) rmSync(join('icons', f));
}
writeFileSync('icons/brand-index.json', JSON.stringify(index, null, 1) + '\n');
const shardIds = shards.map((g) => new Set(g.map((i) => symbols[i].match(/id="([^"]+)"/)[1])));
const broken = index.filter((e) => {
  const set = shardIds[(e.shard || 1) - 1];
  return !set || !set.has(e.id) || (e.color && e.mono && !set.has(e.id + '-mono'));
});
console.log(broken.length ? `  ⚠ 片号指空的品牌 ${broken.length} 个：${broken.slice(0, 5).map((b) => b.id).join(', ')}` : '  ✓ 每个品牌的两个变体都在同一片内');
const allIds = [...sprite.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const dupes = allIds.filter((v, i) => allIds.indexOf(v) !== i);
console.log(`  ✓ 品牌符号 ${symbols.length} 个 · 品牌 ${index.length}（官方色 ${index.filter((b) => b.color).length} · 仅 mono ${index.filter((b) => !b.color).length}）· 切成 ${shards.length} 片（每片 ≤ ~120 KB，规避外部 use 的体积上限）`);
console.log(`  ✓ id 重复：${new Set(dupes).size} 个`);
console.log(`  ✓ icons/brand-index.json：${index.length} 条`);
if (failed.length) { console.log(`  ⚠ 失败 ${failed.length} 条：`); failed.slice(0, 10).forEach((f) => console.log('    ' + f)); }
else console.log('  ✓ 全部转换成功，无失败');
