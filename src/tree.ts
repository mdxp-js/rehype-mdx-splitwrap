/*
 * ESTree functions
 */
import { BaseNode, FunctionDeclaration, ImportDeclaration, JSXElement, JSXFragment } from 'estree-jsx';


export type JSXParent = JSXElement | JSXFragment;
export type JSXChildren = JSXParent['children'];


export function nodeIsImportDeclaration(node: BaseNode | null): node is ImportDeclaration {
	return node?.type === 'ImportDeclaration';
}


export function nodeIsJSXElement(node: BaseNode | null): node is JSXElement {
	return node?.type === 'JSXElement';
}


export function nodeIsFunction(name?: string): (node: BaseNode) => node is FunctionDeclaration {
	return (node: BaseNode): node is FunctionDeclaration => (
		node.type === 'FunctionDeclaration' && (!name || (node as FunctionDeclaration).id?.name === name)
	);
}


export function getJSXElementName(node: JSXElement): string {
	switch (node.openingElement.name.type) {
		case 'JSXIdentifier':
			return node.openingElement.name.name;
		case 'JSXMemberExpression':
			return node.openingElement.name.property.name;
		/* c8 ignore next 2 */
		case 'JSXNamespacedName':
			return node.openingElement.name.name.name;
	}
}

