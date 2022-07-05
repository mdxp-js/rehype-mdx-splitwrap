import type { Plugin } from 'unified'
import type { Expression, JSXElement, JSXFragment, Program, ReturnStatement } from 'estree-jsx'
import { BaseNode, walk } from 'estree-walker'
import { nodeIsImportDeclaration, nodeIsFunction, nodeIsJSXElement, getJSXElementName, JSXChildren, JSXParent } from './tree.js';
import { printTree } from './debug.js';


export type RecmaSplitWrapOptions = {
	/** Component to split the document on */
	splitComponent: string;

	/** Component to wrap the splits in */
	wrapComponent: string;

	/** Path to import the wrapper from. If not specified, we assume it is not neccesary to import (HTML or Provider Component) */
	importPath?: string;

	/** Import name of the component, if not a default import. (default: `wrapComponent` value). */
	importName?: string;

	/** Whether the wrapper is the default import (default: false). */
	defaultImport?: boolean;
}


/**
 *  Recma Plugin that splits an MDX document on a certain component and wraps the resulting splits in another component.
 */
export const recmaSplitWrap: Plugin<[RecmaSplitWrapOptions], Program> = ({
	splitComponent,
	wrapComponent,
	importPath,
	importName,
	defaultImport = false,
}) => {
	return (tree) => {
		if (importPath) {
			// Import wrapper if necessary
			const imports = tree.body
				.filter(nodeIsImportDeclaration)
				.filter(node => node.source.value === importPath)
				.flatMap(node => node.specifiers)
				;

			if (defaultImport) {
				const defaultImports = imports
					.filter(n => n.type === 'ImportDefaultSpecifier')
					.map(n => n.local.name)
					;

				if (defaultImports.length) {
					// Already imported, use imported name instead
					wrapComponent = defaultImports[0];
				} else {
					tree.body.unshift({
						type: 'ImportDeclaration',
						specifiers: [{
					    	type: 'ImportDefaultSpecifier',
						  	local: {
						    	type: 'Identifier',
						    	name: wrapComponent,
						  	},
						}],
						source: {
							type: 'Literal',
							value: importPath,
						},
					})
				}
			} else {
				const importedName = importName ?? wrapComponent;
				const namedImports = imports
					.filter(n => n.type === 'ImportSpecifier' && n.imported.name === importedName)
					.map(n => n.local.name)
					;

				if (namedImports.length) {
					// Already imported, use imported name instead
					wrapComponent = namedImports[0];
				} else {
					tree.body.unshift({
						type: 'ImportDeclaration',
						specifiers: [{
							type: 'ImportSpecifier',
							imported: {
								type: 'Identifier',
								name: importedName,
							},
							local: {
								type: 'Identifier',
								name: wrapComponent,
							},
						}],
						source: {
							type: 'Literal',
							value: importPath,
						},
					})
				}
			}
		}

		// Find MDX content node
		const createMdxContent = tree.body.find(nodeIsFunction('_createMdxContent'));
		/* c8 ignore next 3 */
		if (!createMdxContent) {
			return;
		}

		const mdxContent: ReturnStatement = createMdxContent.body.body[createMdxContent.body.body.length - 1] as ReturnStatement;
		/* c8 ignore next 3 */
		if (!mdxContent || !mdxContent.argument) {
			return;
		}

		// Split and wrap
		let slidesCreated = 0;
		const previousParent: BaseNode[] = [];
		const previousIndex: number[] = [];
		const newChildren: JSXChildren[] = [];

		walk(mdxContent, {
			enter(node, parent, props, index) {
				if (!nodeIsJSXElement(node)) {
					return;
				}

				if (getJSXElementName(node) === splitComponent) {
					// Get first slide child index
					let startIndex: number;
					if (previousParent[previousParent.length - 1] === parent) {
						startIndex = previousIndex.pop() as number;
					} else {
						startIndex = 0;
						previousParent.push(parent);
						newChildren.push([]);
					}

					// Create Slide
					if (startIndex <= index) {
						const children: JSXChildren = (parent as JSXParent).children.slice(startIndex, index);
						newChildren[newChildren.length - 1].push(createSlide(children, wrapComponent));
						slidesCreated++;
					}
					
					// Set index for next slide
					previousIndex.push(index + 1);
				}
			},

			leave(node, parent, props, index) {
				if (previousParent[previousParent.length - 1] === node) {
					const nodeAsParent = previousParent.pop() as JSXParent;
					const lastIndex = previousIndex.pop() as number;
					const children = newChildren.pop() as JSXChildren;

					// Add last slide
					if (lastIndex < nodeAsParent.children.length - 1) {
						children.push(createSlide(nodeAsParent.children.slice(lastIndex), wrapComponent));
						slidesCreated++;
					}

					// Replace Node
					const replacement: JSXParent = {
						...nodeAsParent,
						children: children,
					};
					this.replace(replacement);

					// Fix nested
					if (parent !== mdxContent) {
						// Mark parent as slide parent
						let startIndex: number;
						if (previousParent[previousParent.length - 1] === parent) {
							startIndex = previousIndex.pop() as number;
						} else {
							startIndex = 0;
							previousParent.push(parent);
							newChildren.push([]);
						}

						// Element before nested slides should be a slide
						if (startIndex < index) {
							const children: JSXChildren = (parent as JSXParent).children.slice(startIndex, index);
							if (!children.every(isEmptyChild)) {
								newChildren[newChildren.length - 1].push(createSlide(children, wrapComponent));
								slidesCreated++;
							}
						}

						// Push nested
						newChildren[newChildren.length - 1].push(replacement);

						// Set next index
						const [nextChild, nextIndex] = getNextValidChild(parent as JSXParent, index + 1);
						if (nodeIsJSXElement(nextChild) && getJSXElementName(nextChild) === splitComponent) {
							// Dont add an empty slide if we add a split component after a nested component
							previousIndex.push(nextIndex + 1);
						} else {
							previousIndex.push(index + 1);
						}
					}
				}
			},
		});

		// Wrap entire content if no split was found
		if (slidesCreated == 0) {
			(mdxContent.argument as JSXParent).children = [createSlide((mdxContent.argument as JSXParent).children, wrapComponent)];
		}
	}
}


function createSlide(children: JSXChildren, wrapper: string): JSXElement {
	return {
		type: 'JSXElement',
		children: children,
		openingElement: {
			type: 'JSXOpeningElement',
			name: {
				type: 'JSXIdentifier',
				name: wrapper,
			},
			selfClosing: false,
			attributes: [],
		},
		closingElement: {
			type: 'JSXClosingElement',
			name: {
				type: 'JSXIdentifier',
				name: wrapper,
			},
		},
	};
}


function isEmptyChild(child: JSXChildren[number]) {
	return (
		child.type === 'JSXExpressionContainer' &&
		child.expression.type === 'Literal' &&
		child.expression.value === '\n'
	);
}


function getNextValidChild(parent: JSXParent, index: number): [JSXChildren[number] | null, number] {
	let nextChild: JSXChildren[number] | null;
	do {
		if (parent.children.length > index) {
			nextChild = parent.children[index++];
		} else {
			nextChild = null;
		}
	} while (nextChild && isEmptyChild(nextChild));

	return [nextChild, index - 1];
}
