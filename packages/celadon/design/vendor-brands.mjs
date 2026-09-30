#!/usr/bin/env node
/* 把 @lobehub/icons（MIT）里的第三方品牌 logo 转成我们的标准图标格式：
     Brand/components/Color.js  -> <symbol id="brand-<slug>"      viewBox="0 0 24 24">
     Brand/components/Mono.js   -> <symbol id="brand-<slug>-mono" viewBox="0 0 24 24">
   产出 icons/brand-sprite.svg（独立雪碧图，不内联进页面）+ icons/brand-index.json。
   用法：node vendor-brands.mjs            （自动下载并转换）
        node vendor-brands.mjs <已解包目录>  （离线复用）
   注意：logo 的商标权归各品牌方，仅用于标识对应模型；代码版权见 THIRD-PARTY-NOTICES。 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
const slug = (brand) => 'brand-' + (ALIAS[brand] || brand
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-'));

const KEEP = new Set(['d','fill','fillRule','clipRule','stroke','strokeWidth','strokeLinecap','strokeLinejoin','transform','points','cx','cy','r','rx','ry','x','y','width','height','opacity']);
const toKebab = (k) => k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

/* 从编译后的组件里抽出所有可绘制元素，保留出现顺序 */
function drawables(file) {
  const src = readFileSync(file, 'utf8');
  const out = [];
  for (const m of src.matchAll(/jsx\("(path|circle|rect|ellipse|polygon|line|polyline)",\s*\{([\s\S]*?)\}\s*\)/g)) {
    const [, tag, body] = m;
    const attrs = [];
    let hasFill = false;
    for (const a of body.matchAll(/([a-zA-Z]+):\s*"([^"]*)"/g)) {
      const [, key, val] = a;
      if (!KEEP.has(key)) continue;
      if (key === 'fill') hasFill = true;
      attrs.push(`${toKebab(key)}="${val}"`);
    }
    if (!hasFill) attrs.push('fill="currentColor"');
    out.push(`<${tag} ${attrs.join(' ')}/>`);
  }
  return out;
}
const primary = (file) => (existsSync(file) ? (readFileSync(file, 'utf8').match(/COLOR_PRIMARY\s*=\s*'([^']+)'/) || [])[1] : null);

let root = process.argv[2];
if (!root) {
  const url = `https://registry.npmjs.org/@lobehub/icons/-/icons-${VERSION}.tgz`;
  root = mkdtempSync(join(tmpdir(), 'lobeicons-'));
  process.stdout.write(`  下载 @lobehub/icons@${VERSION} … `);
  execFileSync('curl', ['-sL', url, '-o', join(root, 'p.tgz')]);
  execFileSync('tar', ['xzf', join(root, 'p.tgz'), '-C', root]);
  console.log('✓');
  root = join(root, 'package');
}
const dir = join(root, 'es');
const brands = readdirSync(dir).filter((b) => existsSync(join(dir, b, 'components')));
console.log(`  品牌目录 ${brands.length} 个`);

const symbols = [], index = [], problems = [];
for (const brand of brands.sort()) {
  const hasColor = existsSync(join(dir, brand, 'components/Color.js'));
  const hasMono = existsSync(join(dir, brand, 'components/Mono.js'));
  if (!hasColor && !hasMono) { problems.push(`${brand}: 无 Color/Mono`); continue; }
  const title = (readFileSync(join(dir, brand, 'style.js'), 'utf8').match(/TITLE\s*=\s*'([^']*)'/) || [, brand])[1];
  const colorPrimary = primary(join(dir, brand, 'style.js'));
  const id = slug(brand);
  let monoPaths = [], colorPaths = [];
  try { if (hasMono) monoPaths = drawables(join(dir, brand, 'components/Mono.js')); } catch (e) { problems.push(`${brand}/Mono: ${e.message}`); }
  try { if (hasColor) colorPaths = drawables(join(dir, brand, 'components/Color.js')); } catch (e) { problems.push(`${brand}/Color: ${e.message}`); }
  if (hasColor && !colorPaths.length) { problems.push(`${brand}/Color: 解析出 0 个图元`); }
  const titleAttr = title.replace(/"/g, '&quot;');
  // 每个品牌都有规范 id brand-x：有官方色就用彩色，没有就用 mono 画（currentColor）
  const canon = colorPaths.length ? colorPaths : monoPaths;
  const canonKind = colorPaths.length ? 'Color' : 'Mono';
  if (canon.length) {
    symbols.push(`  <symbol id="${id}" viewBox="0 0 24 24" data-src="lobeicons:${brand}/${canonKind}" data-title="${titleAttr}">${canon.join('')}</symbol>`);
  }
  // 有官方色的品牌再补一个 mono 变体（深色底/单色场景用）
  if (colorPaths.length && monoPaths.length) {
    symbols.push(`  <symbol id="${id}-mono" viewBox="0 0 24 24" data-src="lobeicons:${brand}/Mono" data-title="${titleAttr}">${monoPaths.join('')}</symbol>`);
  }
  index.push({ id, brand, title, primary: colorPrimary || null, color: colorPaths.length > 0, mono: monoPaths.length > 0 });
}

const sprite = `<!-- Third-party brand logos, converted from @lobehub/icons ${VERSION} (MIT, (c) 2023 LobeHub).
     The logos themselves are trademarks of their owners and are used only to identify the corresponding
     models or services; keep them whole and do not recolour the colour variants. Regenerate with
     vendor-brands.mjs. Referenced externally (use href="icons/brand-sprite.svg#brand-x"), not inlined. -->
<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
${symbols.join('\n')}
</defs></svg>
`;
writeFileSync('icons/brand-sprite.svg', sprite);
writeFileSync('icons/brand-index.json', JSON.stringify(index, null, 1) + '\n');
const colorN = index.filter((b) => b.color).length, monoN = index.filter((b) => b.mono).length;
console.log(`  ✓ icons/brand-sprite.svg：${symbols.length} 个符号（品牌 ${index.length} · 带官方色 ${colorN} · 带 mono ${monoN}）· ${(sprite.length / 1024).toFixed(0)} KB`);
console.log(`  ✓ icons/brand-index.json：${index.length} 条`);
if (problems.length) { console.log(`  ⚠ 跳过/异常 ${problems.length} 条：`); problems.slice(0, 8).forEach((p) => console.log('    ' + p)); }
else console.log('  ✓ 无异常');
