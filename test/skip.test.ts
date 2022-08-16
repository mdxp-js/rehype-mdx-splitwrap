/*
 *  JSX SplitWrap skip testing
 */
import { runTests, Test } from './util';


const tests: Test[] = [
	// OUTER
	{
		desc: 'Outer skip should prevent a component at the start of a split to be wrapped',
		source: 'skip/outer-start.mdx',
		result: 'skip/outer-start.jsx',
	},
	{
		desc: 'Outer skip in the middle should behave as an inner skip',
		source: 'skip/outer-middle.mdx',
		result: 'skip/outer-middle.jsx',
	},
	{
		desc: 'Outer skip at the end of a split should prevent it to be wrapped',
		source: 'skip/outer-end.mdx',
		result: 'skip/outer-end.jsx',
	},

	// INNER
	{
		desc: 'Inner skip does not prevent wrapping',
		source: 'skip/inner.mdx',
		result: 'skip/inner.jsx',
	},
	{
		desc: 'Start-Stop skip should work similarly to inner skip',
		source: 'skip/start-stop.mdx',
		result: 'skip/inner.jsx',
	},

	// ROOT
	{
		desc: 'An outer skip on the root should mean no wraps at all',
		source: 'skip/root-outer.mdx',
		result: 'skip/root-outer.jsx',
	},
	{
		desc: 'An inner skip on the root should mean all content is in a single wrap',
		source: 'skip/root-inner.mdx',
		result: 'skip/root-inner.jsx',
	},
	{
		desc: 'Wrapping all content in a start-stop skip is the same as a root inner skip',
		source: 'skip/root-start-stop.mdx',
		result: 'skip/root-inner.jsx',
	},

	// MISC
	{
		desc: 'Different skip comment string',
		source: 'skip/skip-comment.mdx',
		result: 'skip/inner.jsx',
		options: {
			skipComment: 'skip',
		},
	},
	{
		// This should probably never be used in practice
		desc: 'Strided skips in nested components',
		source: 'skip/strided.mdx',
		result: 'skip/strided.jsx',
	},
];


runTests(tests);
