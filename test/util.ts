import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { compileSync } from '@mdx-js/mdx';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { RehypeSplitWrapOptions } from '../src/index';
import rehypeSplitWrap from '../src/index';


export interface Test {
	desc: string;
	source: string;
	result: string;
	fullJSX?: boolean;
	options?: Partial<RehypeSplitWrapOptions>;
}


const defaultOptions: Partial<RehypeSplitWrapOptions> = {
	splitComponent: 'hr',
	wrapperComponent: 'Wrapper',
};


export function runTests(cases: Test[]) {
	for (const uut of cases) {
		test(uut.desc, () => {
			const sourceContent = readFileSync(resolve('test', uut.source)).toString();
			const targetContent = readFileSync(resolve('test', uut.result)).toString();
			const compiledContent = compileSync(sourceContent, {
				jsx: true,
				rehypePlugins: [[rehypeSplitWrap, {...defaultOptions, ...uut.options}]],
			}).toString();

			if (uut.fullJSX) {
				assert.is(compiledContent, targetContent);
			} else {
				// Extract return statement
				let insideMdxContent = false;
				let insideReturn = false;

				const compiledReturn = compiledContent
					.split('\n')
					.map(s => s.trim())
					.reduce((prev, cur) => {
						if (insideMdxContent) {
							if (insideReturn) {
								if (cur.endsWith(';')) {
									insideReturn = false;
									insideMdxContent = false;
								}

								return prev + cur;
							} else if (cur.startsWith('return')) {
								if (cur.endsWith(';')) {
									insideMdxContent = false;
								} else {
									insideReturn = true;
								}

								return cur;
							}
						} else if(cur.startsWith('function _createMdxContent')) {
							insideMdxContent = true;
						}

						return prev;
					}, undefined)
					;

				assert.ok(compiledReturn);

				// 1. Extract JSX
				// 2. remove {"\n"}
				// 3. Add newlines when 2 tags follow each other
				const compiledJSX = compiledReturn
					.substring(7, compiledReturn.length - 1)
					.replace(/{"\\n"}/g, '')
					.split('><').join('>\n<')
					;

				// 1. Flatten result
				// 2. Add newlines when 2 tags follow each other
				const targetJSX = targetContent
					.split('\n').map(s => s.trim()).join('')
					.split('><').join('>\n<')
					;

				// Assert JSX equality
				assert.is(compiledJSX, targetJSX);
			}
		});
	}

	test.run();
}
