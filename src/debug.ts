/*
 * Debug functionality
 */
import { BaseNode, JSXElement } from 'estree-jsx';
import { walk } from 'estree-walker';
import { nodeIsJSXElement, getJSXElementName } from './tree.js';


export function printTree(node: BaseNode) {
	let spaces = 0
	walk(node, {
		enter(node, parent, props, index) {
			if (!nodeIsJSXElement(node)) {
				return;
			}

			const elementName = getJSXElementName(node);
			if (node.openingElement.selfClosing) {
				console.log(' '.repeat(spaces) + '<' + elementName + ' /> ' + index.toString());
				this.skip();
				return;
			} else {
				console.log(' '.repeat(spaces) + '<' + elementName + '> ' + index.toString());
			}
			spaces += 2;
		},

		leave(node) {
			if (!nodeIsJSXElement(node)) {
				return;
			}

			spaces -= 2;
			const elementName = getJSXElementName(node as JSXElement);
			console.log(' '.repeat(spaces) + '</' + elementName + '>');
		},
	})
}

