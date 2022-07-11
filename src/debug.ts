/*
 * Debug functionality
 */
import type { Node, Parent, Element, Text } from 'hast';
import type { MdxJsxFlowElement } from 'mdast-util-mdx';
import { walk } from 'unist-util-walker';


type NodeToString = (node: Node) => string;
export function printTree(node: Node, stringify: NodeToString = printDefault) {
	const previousParents: Parent[] = [];
	let previousNode: Node | null = null;
	let spaces = 0;
	
	walk(node, {
		enter(node, parent) {
			if (parent) {
				if (parent === previousNode) {
					spaces += 2;
					previousParents.push(parent as Parent);
				}
				else {
					while (parent !== previousParents[previousParents.length - 1]) {
						previousParents.pop();
						spaces -= 2;
					}
				}
			}

			console.log(' '.repeat(spaces) + stringify(node));
			previousNode = node;
		}
	});
}


function printDefault(node: Node): string {
	if (node.type === 'element') {
		return `<${(node as Element).tagName}>`;
	} else if (node.type === 'mdxJsxFlowElement') {
		return `<${(node as MdxJsxFlowElement).name}>`
	} else if (node.type === 'text') {
		const text = (node as Text).value
			.replace(/\n/g, '\\n')
			.replace(/\t/g, '\\t')
			;
		return `"${text}"`;
	}

	return node.type;
}
