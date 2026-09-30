#!/usr/bin/env node
/* 装配图标：把「自建雪碧图 + lucide 雪碧图」按 manifest 顺序内联进两个演示页，
   并同步画廊数据（含来源名）、覆盖度数据。
   图标本体在 icons/own-sprite.svg（我们自绘）与 icons/lucide-sprite.svg（lucide，ISC）。
   这里只做装配，不手改图标，也不手改页面里的雪碧图块。 */
import { readFileSync, writeFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('icons/manifest.json', 'utf8'));
const readSymbols = (file) => {
  const src = readFileSync(file, 'utf8');
  return Object.fromEntries((src.match(/<symbol[\s\S]*?<\/symbol>/g) || [])
    .map(s => [s.match(/id="([^"]+)"/)[1], s]));
};
const symbolsById = { ...readSymbols('icons/lucide-sprite.svg'), ...readSymbols('icons/own-sprite.svg') };

const missing = manifest.filter(m => !symbolsById[m.id]).map(m => m.id);
if (missing.length) { console.error(`✗ 雪碧图里缺少：${missing.join(', ')}`); process.exit(1); }
console.log(`  雪碧图共 ${Object.keys(symbolsById).length} 个符号 · manifest ${manifest.length} 条 · 自建 ${manifest.filter(m => m.lib === 'own').length} 个`);

const symbols = manifest.map(m => symbolsById[m.id]);
const block = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>\n${symbols.join('\n')}\n</defs></svg>`;

function patch(file) {
  const src = readFileSync(file, 'utf8');
  const re = /<svg width="0" height="0"[\s\S]*?<\/svg>/;
  if (!re.test(src)) throw new Error(`✗ ${file} 里找不到雪碧图块`);
  let out = src.replace(re, block);
  out = out.replace(/var SYMBOLS = \[[^\]]*\];/, `var SYMBOLS = [${manifest.filter(m => m.cat !== 'brand').map(m => `'${m.id}'`).join(',')}];`);
  out = out.replace(/var LUCIDE = \{[^}]*\};/,
    `var LUCIDE = {${manifest.filter(m => m.lib === 'lucide').map(m => `'${m.id}':'${m.src}'`).join(',')}};`);
  out = out.replace(/var OWN = \[[^\]]*\];/, `var OWN = [${manifest.filter(m => m.lib === 'own').map(m => `'${m.id}'`).join(',')}];`);
  out = out.replace(/var BRANDOWN = \[[^\]]*\];/, `var BRANDOWN = [${manifest.filter(m => m.lib === 'own' && !m.id.endsWith('-mono')).map(m => `'${m.id}'`).join(',')}];`);
  const cats = [...new Set(manifest.map(m => m.cat))];
  const cover = cats.map(cat => `  ['${cat}', [${manifest.filter(m => m.cat === cat).map(m => `'${m.id}'`).join(',')}]]`).join(',\n');
  out = out.replace(/var COVER = \[[\s\S]*?\n\];/, `var COVER = [\n${cover}\n];`);
  const brands = readFileSync('icons/brand-index.json', 'utf8').replace(/\s+/g, ' ');
  out = out.replace(/var BRANDS = \[[\s\S]*?\];/, `var BRANDS = ${brands.trim()};`);
  writeFileSync(file, out);
  console.log(`  ✓ ${file}：内联 ${symbols.length} 个符号`);
}
patch('mock.html');
patch('icons.html');
console.log('  ✓ 完成');
