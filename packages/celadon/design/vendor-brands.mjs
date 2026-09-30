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

const symbols = [], index = [], failed = [];
for (const brand of brands.sort()) {
  const dir = join(work, 'es', brand, 'components');
  const hasColor = existsSync(join(dir, 'Color.js')), hasMono = existsSync(join(dir, 'Mono.js'));
  if (!hasColor && !hasMono) { failed.push(`${brand}: 无 Color/Mono`); continue; }
  const styleFile = join(work, 'es', brand, 'style.js');
  const title = (existsSync(styleFile) ? (readFileSync(styleFile, 'utf8').match(/TITLE\s*=\s*'([^']*)'/) || [])[1] : null) || brand;
  const primary = existsSync(styleFile) ? (readFileSync(styleFile, 'utf8').match(/COLOR_PRIMARY\s*=\s*'([^']+)'/) || [])[1] : null;
  const id = slug(brand);
  const attr = `data-title="${title.replace(/"/g, '&quot;')}"`;
  let color = null, mono = null;
  try { if (hasColor) color = toSymbol(await render(brand, 'Color'), id, false); } catch (e) { failed.push(`${brand}/Color: ${e.message.slice(0, 50)}`); }
  try { if (hasMono) mono = toSymbol(await render(brand, 'Mono'), id, true); } catch (e) { failed.push(`${brand}/Mono: ${e.message.slice(0, 50)}`); }
  const canon = color || mono;
  if (canon) symbols.push(`  <symbol id="${id}" viewBox="${canon.viewBox}" data-src="lobeicons:${brand}/${color ? 'Color' : 'Mono'}" ${attr}>${canon.inner}</symbol>`);
  if (color && mono) symbols.push(`  <symbol id="${id}-mono" viewBox="${mono.viewBox}" data-src="lobeicons:${brand}/Mono" ${attr}>${mono.inner}</symbol>`);
  index.push({ id, brand, title, primary: primary || null, color: !!color, mono: !!mono });
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
writeFileSync('icons/brand-sprite.svg', sprite);
writeFileSync('icons/brand-index.json', JSON.stringify(index, null, 1) + '\n');
console.log(`  ✓ icons/brand-sprite.svg：${symbols.length} 个符号（品牌 ${index.length} · 官方色 ${index.filter((b) => b.color).length} · 仅 mono ${index.filter((b) => !b.color).length}）· ${(sprite.length / 1024).toFixed(0)} KB`);
console.log(`  ✓ icons/brand-index.json：${index.length} 条`);
if (failed.length) { console.log(`  ⚠ 失败 ${failed.length} 条：`); failed.slice(0, 10).forEach((f) => console.log('    ' + f)); }
else console.log('  ✓ 全部转换成功，无失败');
