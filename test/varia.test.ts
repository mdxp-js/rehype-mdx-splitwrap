/*
 *  Various tests that do not fit anny category
 */
import { Root } from 'hast';
import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { splitWrap } from '../src/splitwrap';

test('work with doctype declaration', () => {
	const tree: Root = {
		type: 'root',
		children: [
			{
				type: 'element',
				tagName: 'h1',
	            properties: {},
	            children: [{
		            type: 'text',
					value: 'SPLIT 1',
				}],
			},
			{
				type: 'doctype',
				name: 'html',
			},
			{
				type: 'element',
				tagName: 'p',
	            properties: {},
	            children: [{
		            type: 'text',
					value: 'content',
				}],
			},
		],
	};

	const result: Root = {
		type: 'root',
		children: [
			{
				type: 'doctype',
				name: 'html',
			},
			{
				type: 'element',
				tagName: 'Wrapper',
				properties: {},
				children: [
					{
						type: 'element',
						tagName: 'h1',
			            properties: {},
			            children: [{
				            type: 'text',
							value: 'SPLIT 1',
						}],
					},
					{
						type: 'element',
						tagName: 'p',
			            properties: {},
			            children: [{
				            type: 'text',
							value: 'content',
						}],
					},
				],
			},
		],
	};

	splitWrap(tree, 'hr', 'Wrapper', {});
	assert.equal(tree, result);
});

test.run();
