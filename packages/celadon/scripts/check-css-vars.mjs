#!/usr/bin/env node
/* 样式里用到的自定义属性必须存在：`var(--x)` 既没有在 tokens 或产品样式里声明、又没给兜底值时报错。
   带兜底（`var(--x, …)`）的按安全处理，内联设置的那些（例如列头留白）本来就走兜底。
   检查面：design/tokens.less 的声明 + app/src 下 .less 里的声明 + app/src 下 .less 里的使用。 */
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';

/* 目标：不给参数时检查本包；给一个目录时把它当包根（检查器自测用，样本与真实包同构：
   包根/{design/tokens.less, app/src/**}{,*.less}）。 */
const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = process.argv[2] ? resolve(process.argv[2]) : PACKAGE;
const TOKENS = join(TARGET, 'design', 'tokens.less');
const APP_SRC = join(TARGET, 'app', 'src');
if (!existsSync(APP_SRC)) {
	console.log('✗ app/src does not exist — the checker refuses to pass on an empty tree (target: ' + TARGET + ')');
	process.exit(1);
}

function walk(dir, out = []) {
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) walk(full, out);
		else if (name.endsWith('.less')) out.push(full);
	}
	return out;
}

const files = walk(APP_SRC);
const sources = [TOKENS, ...files].filter((file) => {
	try {
		statSync(file);
		return true;
	} catch {
		return false;
	}
});
const declared = new Set();
for (const file of sources) {
	const text = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
	for (const match of text.matchAll(/(--[a-z0-9-]+)\s*:/gi)) declared.add(match[1]);
}

/* 不设白名单：运行时以内联样式写入的那些名字，在样式表里本来就带兜底值，靠兜底那一支跳过；
   给它们开例外只会掩盖「用了却没声明也没兜底」的真问题。 */

const problems = [];
let used = 0;
for (const file of files) {
	const text = readFileSync(file, 'utf8');
	for (const match of text.matchAll(/var\(\s*(--[a-z0-9-]+)\s*([,)])/gi)) {
		used += 1;
		const [, name, next] = match;
		if (next === ',') continue;
		if (declared.has(name)) continue;
		const line = text.slice(0, match.index).split('\n').length;
		problems.push(`${relative(PACKAGE, file)}:${line} 使用了未声明的 ${name}，又没给兜底值`);
	}
}

if (problems.length) {
	console.log(`✗ ${problems.length} undefined custom propert${problems.length === 1 ? 'y' : 'ies'} (${used} var() checked):`);
	problems.slice(0, 20).forEach((problem) => console.log('  ' + problem));
	console.log('  怎么办：在 tokens.less 或本文件里声明它，或者给它一个兜底值。');
	process.exit(1);
}
console.log(`  ✓ custom properties resolve (${used} var(), ${declared.size} declared)`);
