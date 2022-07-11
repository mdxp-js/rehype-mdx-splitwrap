/*
 *  Import testing
 */
import { runTests, Test } from './util';


const tests: Test[] = [
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


runTests(tests);
