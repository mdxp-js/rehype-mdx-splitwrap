import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { compileSync } from '@mdx-js/mdx';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { recmaSplitWrap } from '../src/index';
import type { RecmaSplitWrapOptions } from '../src/index';


const defaultOptions: Partial<RecmaSplitWrapOptions> = {
	splitComponent: 'hr',
	wrapComponent: 'Wrapper',
};

interface Test {
	desc: string;
	source: string;
	result: string;
	fullJSX?: boolean;
	options?: Partial<RecmaSplitWrapOptions>;
}

const testCases: Test[] = [
	// JSX Tests
	{
		desc: 'Basic content splitting',
		source: 'jsx/base.mdx',
		result: 'jsx/base.jsx',
	},
	{
		desc: 'Wrap entire content when there is no split',
		source: 'jsx/no-split.mdx',
		result: 'jsx/no-split.jsx',
	},
	{
		desc: 'Single empty wrapper for empty document',
		source: 'jsx/empty.mdx',
		result: 'jsx/empty.jsx',
	},
	{
		desc: 'Nested content splitting',
		source: 'jsx/nested.mdx',
		result: 'jsx/nested.jsx',
	},
	{
		desc: 'No empty wrappers at boundaries of nested content',
		source: 'jsx/nested-empty.mdx',
		result: 'jsx/nested.jsx',
	},
	{
		desc: 'Nested content at the end',
		source: 'jsx/nested-end.mdx',
		result: 'jsx/nested-end.jsx',
	},

	// Import tests
	{
		desc: 'Adds named import',
		source: 'import/empty.mdx',
		result: 'import/named.jsx',
		fullJSX: true,
		options: {importPath: '@dummy/import'},
	},
	{
		desc: 'Adds renamed import',
		source: 'import/empty.mdx',
		result: 'import/renamed.jsx',
		fullJSX: true,
		options: {importPath: '@dummy/import', importName: 'OriginalWrapperName'},
	},
	{
		desc: 'Adds default import',
		source: 'import/empty.mdx',
		result: 'import/default.jsx',
		fullJSX: true,
		options: {importPath: '@dummy/import', defaultImport: true},
	},
	{
		desc: 'Skips named import if it already exists',
		source: 'import/imported-named.mdx',
		result: 'import/imported-named.jsx',
		fullJSX: true,
		options: {importPath: '@dummy/import', importName: 'OriginalWrapperName'},
	},
	{
		desc: 'Skips default import if it already exists',
		source: 'import/imported-default.mdx',
		result: 'import/imported-default.jsx',
		fullJSX: true,
		options: {importPath: '@dummy/import', defaultImport: true},
	},
];


for (const uut of testCases) {
	test(uut.desc, () => {
		const sourceContent = readFileSync(resolve('test', uut.source)).toString();
		const targetContent = readFileSync(resolve('test', uut.result)).toString();
		const compiledContent = compileSync(sourceContent, {
			jsx: true,
			recmaPlugins: [[recmaSplitWrap, {...defaultOptions, ...uut.options}]],
		}).toString();

		if (uut.fullJSX) {
			assert.is(compiledContent, targetContent);
		} else {
			// Extract return statement
			const compiledReturn = compiledContent
				.split('\n')
				.map(s => s.trim())
				.filter(s => s.startsWith('return <>'));
			assert.ok(compiledReturn.length);

			// Extract JSX and remove {"\n"}
			const compiledJSX = compiledReturn[0].substring(7, compiledReturn[0].length - 1).replace(/{"\\n"}/g, '');

			// Flatten result
			const targetJSX = targetContent.split('\n').map(s => s.trim()).join('');

			// Assert JSX equality
			assert.is(compiledJSX, targetJSX);
		}
	});
}

test.run();
