#!/usr/bin/env node
/* 把 vendored 的 lucide 雪碧图内联进 mock.html 与 icons.html，并同步画廊/覆盖度数据。
   图标本体在 icons/lucide-sprite.svg（lucide，ISC），这里只做装配，不手改图标。 */
import { readFileSync, writeFileSync } from 'node:fs';

const sprite = readFileSync('icons/lucide-sprite.svg', 'utf8');
const manifest = JSON.parse(readFileSync('icons/manifest.json', 'utf8'));
const symbols = sprite.match(/<symbol[\s\S]*?<\/symbol>/g) || [];
if (symbols.length !== manifest.length) {
  console.error(`✗ 雪碧图 ${symbols.length} 个符号，manifest ${manifest.length} 条，不一致`);
  process.exit(1);
}
const block = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>\n${symbols.join('\n')}\n</defs></svg>`;

function patch(file) {
  const src = readFileSync(file, 'utf8');
  const re = /<svg width="0" height="0"[\s\S]*?<\/svg>/;
  const cur = src.match(re);
  if (!cur) throw new Error(`✗ ${file} 里找不到雪碧图块`);
  let out = src.replace(re, block);
  out = out.replace(/var SYMBOLS = \[[^\]]*\];/,
    `var SYMBOLS = [${manifest.map(m => `'${m.id}'`).join(',')}];`);
  const cover = ['nav', 'act', 'state', 'file', 'obj'].map(cat => {
    const all = manifest.filter(m => m.cat === cat).map(m => `'${m.id}'`).join(',');
    const added = manifest.filter(m => m.cat === cat && m.added).map(m => `'${m.id}'`).join(',');
    return `  ['${cat}', [${all}], [${added}]]`;
  }).join(',\n');
  out = out.replace(/var COVER = \[[\s\S]*?\n\];/, `var COVER = [\n${cover}\n];`);
  writeFileSync(file, out);
  console.log(`  ✓ ${file}：内联 ${symbols.length} 个符号`);
}
patch('mock.html');
patch('icons.html');
console.log('  ✓ 完成（图标来源 lucide · ISC）');
