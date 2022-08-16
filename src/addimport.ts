import type { Node, Root } from 'hast';
import type { ImportDeclaration, Program } from 'estree-jsx';

// Could not find MdxJsEsm type for MDXHAST
// This is not entirely accurate but works for internal typing
interface MdxJsEsm extends Node {
	type: 'mdxjsEsm',
	value: string,
	data: { estree: Program},
};

/**
 * Add import node for a component.
 * This function goes through the MDXHAST tree and adds an import for an item if it is not already imported.
 * It then returns the name you should use for the component in your code (which could be different than the input name, if it was already imported).
 */
export function addImport(
	tree: Root,
	importPath: string,
	itemName: string,
	defaultImport: boolean,
	localName?: string
) : string {
	const importNodes = tree.children
		.filter(nodeIsMdxJsEsm)
		.flatMap(node => node.data.estree.body)
		.filter(nodeIsImportDeclaration)
		.filter(node => node.source.value === importPath)
		.flatMap(node => node.specifiers)
		;

	if (defaultImport) {
		const defaultImports = importNodes
			.filter(node => node.type === 'ImportDefaultSpecifier')
			.map(node => node.local.name)
			;

		if (defaultImports.length) {
			// Already imported, use imported name instead
			localName = defaultImports[0];
		}
		else {
			const newImportNode: MdxJsEsm = {
				type: 'mdxjsEsm',
				value: `import ${itemName} from '${importPath}'`,
				data: {
					estree: {
						type: 'Program',
						sourceType: 'module',
						body: [
							{
								type: 'ImportDeclaration',
								specifiers: [{
									type: 'ImportDefaultSpecifier',
									local: {
										type: 'Identifier',
										name: itemName,
									},
								}],
								source: {
									type: 'Literal',
									value: importPath,
								},
							},
						],
					},
				},
			};

			tree.children.unshift(newImportNode);
		}
	}
	else {
		const namedImports = importNodes
			.filter(node => node.type === 'ImportSpecifier' && node.imported.name === itemName)
			.map(node => node.local.name)
			;

		if (namedImports.length) {
			// Already imported, use imported name instead
			localName = namedImports[0];
		}
		else {
			const importString = localName ? `${itemName} as ${localName}` : itemName;

			const newImportNode: MdxJsEsm = {
				type: 'mdxjsEsm',
				value: `import { ${importString} } from '${importPath}'`,
				data: {
					estree: {
						type: 'Program',
						sourceType: 'module',
						body: [
							{
								type: 'ImportDeclaration',
								specifiers: [{
									type: 'ImportSpecifier',
									imported: {
										type: 'Identifier',
										name: itemName,
									},
									local: {
										type: 'Identifier',
										name: localName ?? itemName,
									},
								}],
								source: {
									type: 'Literal',
									value: importPath,
								},
							},
						],
					},
				},
			};

			tree.children.unshift(newImportNode);
		}
	}

	return localName ?? itemName;
}


function nodeIsMdxJsEsm(node: Node): node is MdxJsEsm {
	return node.type === 'mdxjsEsm';
}


function nodeIsImportDeclaration(node: Node): node is ImportDeclaration {
	return node.type === 'ImportDeclaration';
}
