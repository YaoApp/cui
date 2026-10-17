#!/usr/bin/env node
/* 样式里用到的自定义属性必须存在：`var(--x)` 既没有在 tokens 或产品样式里声明、又没给兜底值时报错。
   带兜底（`var(--x, …)`）的按安全处理，内联设置的那些（例如列头留白）本来就走兜底。
   检查面：design/tokens.less 的声明 + app/src 下 .less 里的声明 + app/src 下 .less 里的使用。 */
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';
import { readFileSync, readdirSync, statSync } from 'node:fs';

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS = join(PACKAGE, 'design', 'tokens.less');
const APP_SRC = join(PACKAGE, 'app', 'src');

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
	const text = readFileSync(file, 'utf8');
	for (const match of text.matchAll(/(--[a-z0-9-]+)\s*:/gi)) declared.add(match[1]);
}

/* 白名单：这些名字由运行时以内联样式写入（React 的 style），样式表里只按兜底值用 */
const RUNTIME = new Set(['--bar-inset', '--head-inset', '--content-width']);

const problems = [];
let used = 0;
for (const file of files) {
	const text = readFileSync(file, 'utf8');
	for (const match of text.matchAll(/var\(\s*(--[a-z0-9-]+)\s*([,)])/gi)) {
		used += 1;
		const [, name, next] = match;
		if (next === ',') continue;
		if (declared.has(name) || RUNTIME.has(name)) continue;
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
