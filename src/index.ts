import type { Plugin } from 'unified';
import type { Root } from 'hast';
import { splitWrap } from './splitwrap.js';
import { printTree } from './debug.js';


export type RehypeSplitWrapOptions = {
	/** Name of the component to split the document. */
	splitComponent: string;

	/** Name of the component to wrap the splits. */
	wrapComponent: string;

	/** Path to import the wrapComponent from. If not specified, we assume it is not neccesary to import (eg. HTML Tag or Provider Component). */
	importPath?: string;

	/** Import name of the wrapComponent, if not a default import (default: `wrapComponent` value). */
	importName?: string;

	/** Whether the wrapComponent is a default import (default: false). */
	defaultImport?: boolean;
}


/**
 *  Rehype Plugin that splits an MDX document on a certain component and wraps the resulting splits in another component.
 */
const rehypeSplitWrap: Plugin<[RehypeSplitWrapOptions], Root> = ({
	splitComponent,
	wrapComponent,
	importPath,
	importName,
	defaultImport = false,
}) => {
	return (tree) => {
		splitWrap(tree, splitComponent, wrapComponent);
	}
}

export default rehypeSplitWrap;
