/*
 *  JSX SplitWrap testing
 */
import { runTests, Test } from './util';


const tests: Test[] = [
	{
		desc: 'Basic content splitting',
		source: 'jsx/base.mdx',
		result: 'jsx/base.jsx',
	},
	{
		desc: 'Split on custom component',
		source: 'jsx/custom-split.mdx',
		result: 'jsx/base.jsx',
		options: {
			splitComponent: 'Custom',
		},
	},
	{
		desc: 'Add properties to wrapper',
		source: 'jsx/base.mdx',
		result: 'jsx/props.jsx',
		options: {
			wrapperProps: {
				className: 'wrapper-class',
				style: {
					backgroundColor: 'red',
				},
			},
		},
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
];


runTests(tests);
