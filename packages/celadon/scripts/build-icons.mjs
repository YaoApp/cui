#!/usr/bin/env node
/* 装配图标：把「自建雪碧图 + lucide 雪碧图」按 manifest 顺序内联进两个演示页，
   并同步画廊数据（含来源名）、覆盖度数据。
   图标本体在 icons/own-sprite.svg（我们自绘）与 icons/lucide-sprite.svg（lucide，ISC）。
   这里只做装配，不手改图标，也不手改页面里的雪碧图块。 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

/* 本脚本住在 scripts/，目标资产在 ../design/ —— 统一切到那里作为工作目录，
   这样下面所有相对路径（icons/… · *.html · tokens.less · i18n/…）都继续成立，
   并且从任何目录调用都不会出错。 */
const DESIGN = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'design')
process.chdir(DESIGN)


const manifest = JSON.parse(readFileSync('icons/manifest.json', 'utf8'));
const readSymbols = (file) => {
  const src = readFileSync(file, 'utf8');
  return Object.fromEntries((src.match(/<symbol[\s\S]*?<\/symbol>/g) || [])
    .map(s => [s.match(/id="([^"]+)"/)[1], s]));
};
const symbolsById = { ...readSymbols('icons/lucide-sprite.svg'), ...readSymbols('icons/own-sprite.svg') };

const missing = manifest.filter(m => !symbolsById[m.id]).map(m => m.id);
if (missing.length) { console.error(`✗ missing from the sprite: ${missing.join(', ')}`); process.exit(1); }
console.log(`  sprite holds ${Object.keys(symbolsById).length} symbol(s) · manifest ${manifest.length} entr(y|ies) · own ${manifest.filter((m) => m.lib === 'own').length}`);

const symbols = manifest.map(m => symbolsById[m.id]);

/* 渐变 / 遮罩 / 裁切这些**绘制资源**必须活在文档级 `<defs>` 里 —— `<use>` 引用 symbol 时内容进
   shadow tree，而 `url(#…)` 按**文档**解析，留在 symbol 内部就找不到（品牌标识的身体会整个不渲染）。
   源里它们写在 symbol 内，所以这里把它们抽出来提升到外面。 */
const DRAWABLE = /<(linearGradient|radialGradient|mask|clipPath|filter)\b[\s\S]*?<\/\1>/g;
const hoisted = [];
const stripped = symbols.map((sym) =>
  sym.replace(DRAWABLE, (m) => {
    hoisted.push(m);
    return '';
  }),
);
const block = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>\n${hoisted.join('\n')}\n</defs>\n${stripped.join('\n')}\n</svg>`;

/* 应用侧产物（方案 A：整块内联）。设计目录里的雪碧图是**源**，这里是**产物**——
   `check-generated.mjs` 会重新生成并比对，改图不跑脚本就红（与 tokens.css 同一套）。 */
const APP_ICONS = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'src', 'platform', 'icons')
const SPRITE_HEADER = `<!-- generated — do not edit by hand; source: design/icons/ (node scripts/build-icons.mjs) -->`
writeFileSync(resolve(APP_ICONS, 'sprite.svg'), `${SPRITE_HEADER}\n${block}\n`)
writeFileSync(
  resolve(APP_ICONS, 'icon-ids.ts'),
  `/* generated — do not edit by hand; source: design/icons/manifest.json (node scripts/build-icons.mjs) */\n` +
    `export type IconId =\n` +
    symbols.map((_, i) => `  | '${manifest[i].id}'`).join('\n') +
    '\n',
)

function patch(file) {
  const src = readFileSync(file, 'utf8');
  const re = /<svg width="0" height="0"[\s\S]*?<\/svg>/;
  if (!re.test(src)) throw new Error(`✗ no sprite block found in ${file}`);
  let out = src.replace(re, block);
  out = out.replace(/var SYMBOLS = \[[^\]]*\];/, `var SYMBOLS = [${manifest.filter(m => m.cat !== 'brand').map(m => `'${m.id}'`).join(',')}];`);
  out = out.replace(/var LUCIDE = \{[^}]*\};/,
    `var LUCIDE = {${manifest.filter(m => m.lib === 'lucide').map(m => `'${m.id}':'${m.src}'`).join(',')}};`);
  out = out.replace(/var OWN = \[[^\]]*\];/, `var OWN = [${manifest.filter(m => m.lib === 'own').map(m => `'${m.id}'`).join(',')}];`);
  const ownBrands = manifest.filter((m) => m.lib === 'own' && m.cat === 'brand' && !m.id.endsWith('-mono'))
    .map((m) => ({ id: m.id, brand: m.id.replace(/^brand-/, ''), title: m.id === 'brand-yao-agents' ? 'Yao Agents' : m.id.replace(/^brand-/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), lib: 'own', color: true, mono: true }));
  out = out.replace(/var OWNBRANDS = \[[\s\S]*?\];/, `var OWNBRANDS = ${JSON.stringify(ownBrands)};`);
  const cats = [...new Set(manifest.map(m => m.cat))];
  const cover = cats.map(cat => `  ['${cat}', [${manifest.filter(m => m.cat === cat).map(m => `'${m.id}'`).join(',')}]]`).join(',\n');
  out = out.replace(/var COVER = \[[\s\S]*?\n\];/, `var COVER = [\n${cover}\n];`);
  const lobe = JSON.parse(readFileSync('icons/brand-index.json', 'utf8')).map((e) => ({ ...e, lib: 'ai' }));
  const simple = existsSync('icons/brand-simple-index.json')
    ? JSON.parse(readFileSync('icons/brand-simple-index.json', 'utf8')) : [];
  const brands = JSON.stringify([...lobe, ...simple]).replace(/\s+/g, ' ');
  out = out.replace(/var BRANDS = \[[\s\S]*?\];/, `var BRANDS = ${brands.trim()};`);
  writeFileSync(file, out);
  console.log(`  ✓ ${file}: inlined ${symbols.length} symbol(s)`);
}
patch('mock.html');
patch('icons.html');
console.log('  ✓ done');
