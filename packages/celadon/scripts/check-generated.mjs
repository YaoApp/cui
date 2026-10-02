#!/usr/bin/env node
/* 生成物一致性检查：跑一遍生成脚本，产物与仓库不一致即失败。
   · tokens.css —— build-css.mjs 一次生成两份相同内容：design/ 与 app/src/platform/theme/，
     两份都在比对清单里。
   · icons.html / mock.html —— build-icons.mjs 从 icons/*.svg + manifest 装配。
   · app/src/platform/icons/{sprite.svg,icon-ids.ts} —— 同一脚本产出的**应用侧**图标产物。
   曾经出现"改了源但忘了重跑，页面里还是旧副本"的问题，这里把它变成可检查的。

   可选：第一个参数是"包根"（测试用）；省略即检查真实仓库。给了参数时只比对 tokens.css
   —— 样本目录没有整套雪碧图与清单。 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE = resolve(HERE, '..');
const ROOT = process.argv[2] ? resolve(process.argv[2]) : PACKAGE;
const DESIGN = resolve(ROOT, 'design');
const inRepo = ROOT === PACKAGE;

/* tokens.less 是共同源；没有它说明目标目录不对 —— "扫到 0 个文件也算通过"是最危险的假绿。 */
if (!existsSync(resolve(DESIGN, 'tokens.less'))) {
  console.log('✗ no design/tokens.less — wrong target directory? (target: ' + ROOT + ')');
  process.exit(1);
}

/* ---- tokens.css：一次生成、两份落盘，两份都比 ---- */
const TOKENS = [
  'design/tokens.css',
  'app/src/platform/theme/tokens.css',
];
const missing = TOKENS.filter((f) => !existsSync(resolve(ROOT, f)));
if (missing.length) {
  console.log(`  ✗ generated file(s) missing: ${missing.join(', ')} — run \`node scripts/build-css.mjs\``);
  process.exit(1);
}
const tokensBefore = TOKENS.map((f) => readFileSync(resolve(ROOT, f), 'utf8'));
execFileSync('node', [resolve(HERE, 'build-css.mjs'), ROOT], { stdio: 'pipe' });
const stale = TOKENS.filter((f, i) => readFileSync(resolve(ROOT, f), 'utf8') !== tokensBefore[i]);
if (stale.length) {
  console.log(`  ✗ generated files are stale: ${stale.join(', ')} — run \`node scripts/build-css.mjs\` and commit the output`);
  process.exit(1);
}
console.log(`  ✓ generated tokens.css match their source (${TOKENS.join(' / ')})`);

/* ---- icons.html / mock.html 与品牌标记：只在真实仓库里跑（样本目录没有整套雪碧图与清单）---- */
if (inRepo) {
  const APP_ICONS = ['app/src/platform/icons/sprite.svg', 'app/src/platform/icons/icon-ids.ts'];
  const iconsMissing = APP_ICONS.filter((f) => !existsSync(resolve(ROOT, f)));
  if (iconsMissing.length) {
    console.log(`  ✗ generated file(s) missing: ${iconsMissing.join(', ')} — run \`node scripts/build-icons.mjs\``);
    process.exit(1);
  }
  const GENERATED = ['icons.html', 'mock.html'].map((f) => resolve(DESIGN, f))
    .concat(APP_ICONS.map((f) => resolve(ROOT, f)));   /* build-icons.mjs 的产物（含应用侧图标） */
  const files = ['icons.html', 'mock.html', 'index.html'].map((f) => resolve(DESIGN, f));   /* 颜色类检查覆盖三张规范页 */
  const before = GENERATED.map((f) => readFileSync(f, 'utf8'));
  execFileSync('node', [resolve(HERE, 'build-icons.mjs')], { stdio: 'pipe' });
  const iconsStale = GENERATED.filter((f, i) => readFileSync(f, 'utf8') !== before[i]);
  if (iconsStale.length) {
    console.log(`  ✗ generated files are stale: ${iconsStale.map((f) => f.replace(PACKAGE + '/', '')).join(', ')} — commit the output of build-icons.mjs`);
    process.exit(1);
  }
  console.log('  ✓ generated files match their sources (icons.html / mock.html / platform icons)');

  // 品牌标记的颜色只允许来自 token：写死色值会让页面和 token 悄悄脱钩
  const hard = ['#2A7B7B', '#389F9F', '#2FA79C', '#0CC8B7', '#F4F1EA', '#FFFFFF'];
  let dirty = [];
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    for (const c of hard) if (text.includes('fill="' + c + '"') || text.includes('fill:' + c) || text.includes('stop-color="' + c + '"')) dirty.push(`${f.replace(PACKAGE + '/', '')}: ${c}`);
  }
  if (dirty.length) {
    console.log(`  ✗ brand mark colours are hardcoded: ${dirty.slice(0, 4).join(', ')} — use --brand-mark-* / --brand-eye`);
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
        if (/fill\s*[:=]\s*["']?\s*[^;"']*$/.test(ctx) || /stop-color\s*[:=]\s*["']?$/.test(ctx)) wrongUse.push(`${f.replace(PACKAGE + '/', '')}: ${ctx.slice(-24)}${w}`);
        i = text.indexOf(w, i + 1);
      }
    }
  }
  if (wrongUse.length) {
    console.log(`  ✗ a UI brand token is painting the mark: ${wrongUse.slice(0, 3).join(' · ')}`);
    console.log('      use --brand-mark-from/to and --brand-eye instead');
    process.exit(1);
  }
  console.log('  ✓ every brand mark colour comes from a token');
}
