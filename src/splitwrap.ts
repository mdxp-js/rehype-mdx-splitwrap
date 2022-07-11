import type { Element as HastElement, Text, Root, DocType } from 'hast';
import type { MdxJsxAttribute, MdxJsxExpressionAttribute} from 'mdast-util-mdx';
import type { Node, Parent } from 'unist';
import { walk } from 'unist-util-walker';


// Could not find MdxJsxFlowElement type for MDXHAST
// This is not entirely accurate but works for internal typing
interface MdxJsxFlowElement extends Node {
	type: 'mdxJsxFlowElement',
	name: string | null,
	attributes: Array<MdxJsxAttribute | MdxJsxExpressionAttribute>,
	children: HastElement['children'],
};

type Element = HastElement | MdxJsxFlowElement;
type Children = Element['children'];
export type Properties = { [name: string]: any };

/**
 * Split MDXHAST tree on a certain component and wrap the resulting splits.
 */
export function splitWrap(
	tree: Root,
	splitComponent: string,
	wrapperComponent: string,
	wrapperProps: Properties,
) {
	let slidesCreated = 0;
	const previousParent: Element[] = [];
	const previousIndex: number[] = [];
	const newChildren: Children[] = [];

	walk(tree, {
		enter(node, parent, _index) {
			if (!nodeIsElement(node) || !parent) {
				return;
			}
			const index: number = _index as number;

			if (getElementName(node) === splitComponent) {
				// Get first slide child index
				let startIndex: number;
				if (previousParent[previousParent.length - 1] === parent) {
					startIndex = previousIndex.pop() as number;
				} else {
					startIndex = 0;
					previousParent.push(parent as Element);
					newChildren.push([]);
				}

				// Create Slide
				if (startIndex <= index) {
					const children = (parent as Element).children.slice(startIndex, index);
					newChildren[newChildren.length - 1].push(createSlide(children, wrapperComponent, wrapperProps));
					slidesCreated++;
				}
				
				// Set index for next slide
				previousIndex.push(index + 1);
			}
		},

		leave(node, parent, _index) {
			if (previousParent[previousParent.length - 1] === node) {
				const nodeAsElement = previousParent.pop() as Element;
				const lastIndex = previousIndex.pop() as number;
				const children = newChildren.pop() as Children;

				// Add last slide
				if (lastIndex < nodeAsElement.children.length - 1) {
					children.push(createSlide(nodeAsElement.children.slice(lastIndex), wrapperComponent, wrapperProps));
					slidesCreated++;
				}

				// Replace Node
				const replacement = {
					...nodeAsElement,
					children,
				}
				this.replace(replacement);

				// Fix nested
				if (parent) {
					const index: number = _index as number;
					let startIndex: number;

					// Mark parent as slide parent
					if (previousParent[previousParent.length - 1] === parent) {
						startIndex = previousIndex.pop() as number;
					} else {
						startIndex = 0;
						previousParent.push(parent as Element);
						newChildren.push([]);
					}

					// Element before nested slides should be a slide
					if (startIndex < index) {
						const children: Children = (parent as Element).children.slice(startIndex, index);
						if (!children.every(isEmptyChild)) {
							newChildren[newChildren.length - 1].push(createSlide(children, wrapperComponent, wrapperProps));
							slidesCreated++;
						}
					}

					// Push nested
					newChildren[newChildren.length - 1].push(replacement as Children[number]);

					// Set next index
					const [nextChild, nextIndex] = getNextValidChild(parent, index + 1);
					if (nextChild && nodeIsElement(nextChild) && getElementName(nextChild) === splitComponent) {
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
		// Split doctype children
		const [doctype, other]: [DocType[], Children] = tree.children.reduce(
			([doctype, other]: [DocType[], Children], element) => {
				return element.type === 'doctype' ? [[...doctype, element], other] : [doctype, [...other, element]];
			},
			[[], []]
		);

		// Process other children and merge doctype back in
		tree.children = [...doctype, createSlide(other, wrapperComponent, wrapperProps)];
	}
}


function nodeIsElement(node: Node): node is Element {
	return node.type === 'element' || node.type === 'mdxJsxFlowElement';
}


function getElementName(node: Element): string {
	if (node.type === 'element') {
		return (node as HastElement).tagName;
	} else {
		/* c8 ignore next */
		return (node as MdxJsxFlowElement).name ?? '';
	}
}


function isEmptyChild(node: Node): boolean {
	return (
		node.type === 'text' &&
		(node as Text).value === '\n'
	);
}


function getNextValidChild(parent: Parent, index: number): [Node | null, number] {
	let nextChild: Node | null;
	do {
		if (parent.children.length > index) {
			nextChild = parent.children[index++];
		} else {
			nextChild = null;
		}
	} while (nextChild && isEmptyChild(nextChild));

	return [nextChild, index - 1];
}


function createSlide(nodes: Children, wrapper: string, props: Properties): HastElement {
	return {
		type: 'element',
		tagName: wrapper,
		children: nodes,
		properties: props,
	};
}
