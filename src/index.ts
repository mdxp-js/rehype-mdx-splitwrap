import type { Plugin } from 'unified';
import type { Root } from 'hast';
import type { Properties } from './splitwrap.js';
import { splitWrap } from './splitwrap.js';
import { addImport } from './addimport.js';
import { printTree } from './debug.js';


export type RehypeSplitWrapOptions = {
	/** Name of the component to split the document. */
	splitComponent: string;

	/** Name of the component to wrap the splits. */
	wrapperComponent: string;

	/** Properties that will be added to the wrapper components. */
	wrapperProps?: Properties;

	/** Path to import the wrapperComponent from. If not specified, we assume it is not neccesary to import (eg. HTML Tag or Provider Component). */
	importPath?: string;

	/** Import name of the wrapperComponent, if not a default import (default: `wrapperComponent` value). */
	importName?: string;

	/** Whether the wrapperComponent is a default import (default: false). */
	defaultImport?: boolean;
}


/**
 *  Rehype Plugin that splits an MDX document on a certain component and wraps the resulting splits in another component.
 */
const rehypeSplitWrap: Plugin<[RehypeSplitWrapOptions], Root> = ({
	splitComponent,
	wrapperComponent,
	wrapperProps = {},
	importPath,
	importName,
	defaultImport = false,
}) => {
	return (tree) => {
		if (importPath) {
			if (importName) {
				wrapperComponent = addImport(tree, importPath, importName, defaultImport, wrapperComponent);
			} else {
				wrapperComponent = addImport(tree, importPath, wrapperComponent, defaultImport);
			}
		}

		splitWrap(tree, splitComponent, wrapperComponent, wrapperProps);
	}
}

export default rehypeSplitWrap;
