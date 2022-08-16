import type { Program } from 'estree-jsx';
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

// Could not find MdxJsxFlowExpression type for MDXHAST
// This is not entirely accurate but works for internal typing
interface MdxJsxFlowExpression extends Node {
	type: 'MdxFlowExpression',
	data: {estree: Program},
};

type Element = HastElement | MdxJsxFlowElement;
type Child = Element['children'][number];
export type Properties = { [name: string]: any };

type SkipTypes = 'start' | 'stop' | 'inner' | 'outer';

type ParentData = {
	children: Child[];
	previousIndex: number;
	outerSkipIndices: number[];
}

/**
 * Split MDXHAST tree on a certain component and wrap the resulting splits.
 */
export function splitWrap(
	tree: Root,
	splitComponent: string,
	wrapperComponent: string,
	wrapperProps: Properties,
	skipString: string,
) {
	let slidesCreated = 0;
	let skip: SkipTypes = 'stop';
	const previousParents = new Map<Parent, ParentData>();

	walk(tree, {
		enter(node, parent, _index) {
			if (!parent) {
				return;
			}
			const index: number = _index as number;

			if (skip === 'inner' || skip === 'outer') {
				this.break();
				return;
			}

			if (nodeIsElement(node) && skip === 'stop') {
				if (getElementName(node) === splitComponent) {
					// Get first slide child index
					let data = previousParents.get(parent);
					if (!data) {
						data = {
							previousIndex: 0,
							children: [],
							outerSkipIndices: [],
						};
						previousParents.set(parent, data);
					}

					// Create Slide
					const [children, before, after] = getSlideChildren(
						(parent as Element).children,
						data.previousIndex,
						index - 1,
						data.outerSkipIndices,
					);

					data.children.push(...before);
					if (children.length) {
						data.children.push(createSlide(children, wrapperComponent, wrapperProps));
						slidesCreated++;
					}
					data.children.push(...after);

					// Set index for next slide
					data.previousIndex = index + 1;
				}
			}
			else if (nodeIsExpression(node)) {
				let skipComment = node.data.estree.comments
					?.map(c => c.value.trim().toLowerCase())
					.find(s => s.startsWith(skipString))
					;

				if (skipComment) {
					skipComment = skipComment.substring(skipString.length).trim();

					if (skipComment.startsWith('start') && skip === 'stop') {
						skip = 'start';
						this.remove();
					}
					else if (skipComment.startsWith('stop') && skip === 'start') {
						skip = 'stop';
						this.remove();
					}
					else if (skipComment.startsWith('outer') && skip === 'stop') {
						skip = 'outer';
						this.remove();

						// Remove any previously wrapped children
						previousParents.delete(parent);
					}
					else if (skipComment.startsWith('inner') && skip === 'stop') {
						skip = 'inner';
						this.remove();

						// Remove any previously wrapped children
						previousParents.delete(parent);
					}
				}
			}
		},

		leave(node, parent, _index) {
			const data = previousParents.get(node as Parent) as ParentData;

			if (data && data.children.length) {
				const nodeAsElement = node as Element;

				// Add last slide
				if (data.previousIndex < nodeAsElement.children.length - 1) {
					// Create Slide
					const [children, before, after] = getSlideChildren(
						nodeAsElement.children,
						data.previousIndex,
						nodeAsElement.children.length - 1,
						data.outerSkipIndices,
					);

					data.children.push(...before);
					if (children.length) {
						data.children.push(createSlide(children, wrapperComponent, wrapperProps));
						slidesCreated++;
					}
					data.children.push(...after);
				}

				// Replace Node
				const replacement: Element = {
					...nodeAsElement,
					children: data.children,
				}
				this.replace(replacement);

				// Fix nested
				if (parent) {
					const index: number = _index as number;

					// Mark parent as slide parent
					let parentData = previousParents.get(parent);
					if (!parentData) {
						parentData = {
							previousIndex: 0,
							children: [],
							outerSkipIndices: [],
						};
						previousParents.set(parent, parentData);
					}

					// Elements before Nested should be a Slide
					const [children, before, after] = getSlideChildren(
						(parent as Element).children,
						parentData.previousIndex,
						index - 1,
						parentData.outerSkipIndices,
					);

					parentData.children.push(...before);
					if (children.length && !children.every(isEmptyChild)) {
						parentData.children.push(createSlide(children, wrapperComponent, wrapperProps));
						slidesCreated++;
					}
					parentData.children.push(...after);

					// Push nested
					parentData.children.push(replacement as Child);

					// Set next index
					const [nextChild, nextIndex] = getNextValidChild(parent, index + 1);
					if (nextChild && nodeIsElement(nextChild) && getElementName(nextChild) === splitComponent) {
						// Dont add an empty slide if we add a split component after a nested component
						parentData.previousIndex = nextIndex + 1;
					}
					else {
						parentData.previousIndex = index + 1;
					}
				}
			}

			// Skips
			if (skip === 'inner') {
				skip = 'stop';
			}
			else if (skip === 'outer') {
				if (parent) {
					skip = 'stop';

					if (previousParents.has(parent)) {
						const data = previousParents.get(parent) as ParentData;
						data.outerSkipIndices.push(_index as number);
					}
					else {
						previousParents.set(parent, {
							children: [],
							previousIndex: 0,
							outerSkipIndices: [_index as number],
						});
					}
				}
			}
		},
	});

	// Wrap entire content if no split was found
	if (slidesCreated == 0 && skip === 'stop') {
		// Split doctype children
		const [doctype, other]: [DocType[], Child[]] = tree.children.reduce(
			([doctype, other]: [DocType[], Child[]], element) => {
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


function nodeIsExpression(node: Node): node is MdxJsxFlowExpression {
	return node.type === 'mdxFlowExpression' && (node.data?.estree as Node).type == 'Program';
}


function getElementName(node: Element): string {
	if (node.type === 'element') {
		return (node as HastElement).tagName;
	}
	else {
		/* c8 ignore next */
		return (node as MdxJsxFlowElement).name ?? '';
	}
}


function isEmptyChild(node: Node): boolean {
	return (
		node.type === 'text' &&
		((node as Text).value === '\n' || (node as Text).value === '')
	);
}


function getNextValidChild(parent: Parent, index: number): [Node | null, number] {
	let nextChild: Node | null;
	do {
		if (parent.children.length > index)
			nextChild = parent.children[index++];
		else
			nextChild = null;
	} while (nextChild && isEmptyChild(nextChild));

	return [nextChild, index - 1];
}


function getSlideChildren(elements: Child[], start: number, stop: number, skips: number[] = []): [Child[], Child[], Child[]] {
	const before: Child[] = [];
	const after: Child[] = [];

	// Get start index
	while (isEmptyChild(elements[start]) || skips.includes(start)) {
		before.push(elements[start] as Child);
		start++;
	}

	// Get stop index
	while (isEmptyChild(elements[stop]) || skips.includes(stop)) {
		after.push(elements[stop] as Child);
		stop--;
	}

	let children: Child[] = []
	if (start <= stop) {
		children = elements.slice(start, stop + 1);
	}

	return [children, before, after];
}


function createSlide(nodes: Child[], wrapper: string, props: Properties): HastElement {
	return {
		type: 'element',
		tagName: wrapper,
		children: nodes,
		properties: props,
	};
}
