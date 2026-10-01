#!/usr/bin/env node
/* 第二来源：simple-icons（CC0）—— **按需**引入通用品牌（微信 / Slack / Notion / Figma …）。
   不批量导入（3463 个，绝大多数与产品无关）；只转你点名的那些，格式与 lobehub 来源完全一致。

   用法：
     node vendor-simple.mjs wechat notion figma      # 按需转入我们的 brand-*
     node vendor-simple.mjs --search wechat          # 先查有没有、slug 是什么
     node vendor-simple.mjs --dry wechat             # 只看会生成什么，不写文件
     node vendor-simple.mjs --list                   # 已引入的 simple-icons 品牌
   产出：icons/brand-simple-*.svg（分片）+ icons/brand-simple-index.json
   注意：logo 商标权归各品牌方，仅用于标识对应服务；CC0 不要求署名，仍登记在 THIRD-PARTY-NOTICES。 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

/* 本脚本住在 scripts/，目标资产在 ../design/ —— 统一切到那里作为工作目录，
   这样下面所有相对路径（icons/… · *.html · tokens.less · i18n/…）都继续成立，
   并且从任何目录调用都不会出错。 */
const DESIGN = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'design')
process.chdir(DESIGN)


const VERSION = '16.33.0';
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const names = args.filter((a) => !a.startsWith('--'));

const work = mkdtempSync(join(tmpdir(), 'simpleicons-'));
process.stdout.write(`  fetching simple-icons@${VERSION} … `);
execFileSync('curl', ['-sL', `https://registry.npmjs.org/simple-icons/-/simple-icons-${VERSION}.tgz`, '-o', join(work, 'p.tgz')]);
execFileSync('tar', ['xzf', join(work, 'p.tgz'), '-C', work]);
const pkg = join(work, 'package');
const data = JSON.parse(readFileSync(join(pkg, 'data', 'simple-icons.json'), 'utf8'));
const icons = data.icons || data;
const byKey = new Map();
for (const e of icons) {
  const slug = e.slug || e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  byKey.set(slug.toLowerCase(), { ...e, slug });
  byKey.set(String(e.title).toLowerCase(), { ...e, slug });
}
const ours = JSON.parse(readFileSync('icons/brand-index.json', 'utf8'));
const oursKeys = new Set(ours.flatMap((e) => [e.id, e.brand.toLowerCase(), e.title.toLowerCase()].map((s) => String(s).toLowerCase())));
const file = 'icons/brand-simple-index.json';
const have = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
console.log(`✓ (simple-icons holds ${icons.length} brand(s) · ${ours.length} already came from lobehub · ${have.length} pulled in on demand)`);

if (flag('--search')) {
  const q = (names[0] || '').toLowerCase();
  const hits = icons.filter((e) => e.title.toLowerCase().includes(q) || (e.slug || '').includes(q)).slice(0, 20);
  console.log(`  "${q}" matches ${hits.length}:`);
  hits.forEach((e) => console.log(`    ${(e.slug || '').padEnd(24)} ${e.title}  #${e.hex}${oursKeys.has(e.title.toLowerCase()) ? '  ← already ours (keeping the lobehub copy)' : ''}`));
  process.exit(0);
}
if (flag('--list')) {
  console.log(`  already pulled in on demand: ${have.map((e) => e.id).join(', ') || '(none)'}`);
  process.exit(0);
}
if (!names.length) { console.log('  no brand names given. usage: node vendor-simple.mjs wechat notion figma'); process.exit(0); }

const xmlEsc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const picked = [], skipped = [], unknown = [];
for (const n of names) {
  const e = byKey.get(n.toLowerCase());
  if (!e) { unknown.push(n); continue; }
  if (oursKeys.has(e.title.toLowerCase()) || oursKeys.has(e.slug)) { skipped.push(`${n} (lobehub already has it; keeping that copy)`); continue; }
  const svgFile = join(pkg, 'icons', `${e.slug}.svg`);
  if (!existsSync(svgFile)) { unknown.push(`${n} (metadata but no svg)`); continue; }
  const svg = readFileSync(svgFile, 'utf8');
  const d = (svg.match(/\bd="([^"]+)"/g) || []).map((m) => m.slice(3, -1));
  if (!d.length) { unknown.push(`${n} (svg has no path)`); continue; }
  const inner = d.map((x) => `<path d="${x}" fill="#${(e.hex || '000000').toUpperCase()}"/>`).join('');
  const mono = d.map((x) => `<path d="${x}" fill="currentColor"/>`).join('');
  picked.push({ id: 'brand-' + e.slug, brand: e.title, title: e.title, primary: '#' + (e.hex || '').toUpperCase(), color: true, mono: true, lib: 'simpleicons', inner, monoInner: mono });
}
console.log(`  resolved: ${picked.length} picked · ${skipped.length} skipped · ${unknown.length} not found`);
skipped.forEach((s) => console.log(`    · skipped ${s}`));
unknown.forEach((s) => console.log(`    · not found ${s}`));
if (flag('--dry')) {
  picked.slice(0, 3).forEach((p) => console.log(`    (dry) ${p.id} ← ${p.brand} ${p.primary} · ${(p.inner.match(/<path/g) || []).length} path(s)`));
  console.log('  --dry: nothing was written');
  process.exit(0);
}
if (!picked.length) { console.log('  no brand to write'); process.exit(0); }

/* 分片：沿用 lobehub 的做法，按体积切，且同一品牌的两个变体同片 */
const all = have.concat(picked.map(({ inner, monoInner, ...e }) => ({ ...e, symbols: [
  `  <symbol id="${e.id}" viewBox="0 0 24 24" data-src="simpleicons:${xmlEsc(e.brand)}" data-title="${xmlEsc(e.title)}">${inner}</symbol>`,
  `  <symbol id="${e.id}-mono" viewBox="0 0 24 24" data-src="simpleicons:${xmlEsc(e.brand)}" data-title="${xmlEsc(e.title)}">${monoInner}</symbol>`,
] })));
const header = `<!-- Third-party brand logos converted from simple-icons ${VERSION} (CC0-1.0). The logos are
     trademarks of their owners and identify the corresponding services; do not recolour the colour
     variants. Regenerate additions with vendor-simple.mjs. Referenced externally, not inlined. -->
<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
`;
const SHARD = 120 * 1024;
const shards = [[]];
let acc = header.length;
for (const e of all) {
  const size = e.symbols.join('').length;
  if (acc + size > SHARD && shards[shards.length - 1].length) { shards.push([]); acc = header.length; }
  shards[shards.length - 1].push(e); acc += size + 1;
}
for (const f of readdirSync('icons')) {
  if (/^brand-simple-\d+\.svg$/.test(f)) writeFileSync(join('icons', f), '');  // 清空待改写
}
shards.forEach((group, i) => {
  const n = i + 1;
  for (const e of group) e.shard = n;
  writeFileSync(`icons/brand-simple-${n}.svg`, header + group.flatMap((e) => e.symbols).join('\n') + '\n</defs></svg>\n');
});
for (const f of readdirSync('icons')) {
  const m = f.match(/^brand-simple-(\d+)\.svg$/);
  if (m && Number(m[1]) > shards.length) writeFileSync(join('icons', f), ''), execFileSync('rm', ['-f', join('icons', f)]);
}
writeFileSync(file, JSON.stringify(all.map(({ symbols, ...e }) => e), null, 1) + '\n');
console.log(`  ✓ wrote ${picked.length} brand(s) → ${all.length} in total · ${shards.length} shard(s)`);
picked.forEach((p) => console.log(`    + ${p.id}（${p.brand}）${p.primary}`));
console.log('  → run node build-icons.mjs to take effect');
