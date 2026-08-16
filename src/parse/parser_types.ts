import {treeifyObject} from "./../vendored/treeify.ts"

/**
	Enum representing all possible combinators (aka relations between
	adjacent contraint blocks in the json match lang expression)
*/
export enum ExpressionCombinator {
	DESCENDANT,   // represented as absence of operator between two constraints
	CHILD,              // TokenKind.OPERATOR_CHILD
	PARENT,             // TokenKind.OPERATOR_PARENT

	SIBLING_NEXT,       // TokenKind.OPERATOR_SIBLING_NEXT
	SIBLING_PREV,       // TokenKind.OPERATOR_SIBLING_PREV
	SIBLING_SUBSEQUENT, // TokenKind.OPERATOR_SIBLING_SUBSEQUENT
	SIBLING_PRECEDING,  // TokenKind.OPERATOR_SIBLING_PRECEDING
	SIBLING_ANY,        // TokenKind.OPERATOR_SIBLING_ANY
}

/**
	Each node in constraint tree must be one one of the following kinds.
*/
export enum ConstraintTreeNodeKind {
	ATOM,         // has always 0 children
	PARENS,       // has always 1 child
	NOT,          // has always 1 child
	AND,          // has at least 1 child
	OR,           // has at least 1 child
}

/**
	Kind describes type of the tree node.

	Range describes (filtered) index range of tokens
	that spans the tree node and all its children. 
	
	Children array describes 0 or more children of the current node.
*/
export type ConstraintTreeNode = {
	kind: ConstraintTreeNodeKind,
	range: [number, number],
	children: Array<ConstraintTreeNode>,
	
}


/**
	Structure representing a successful parse output

	Json match lang expression's syntax is inherently linear -
		each constraint block follows a combinator
		and each combinator follows a constraint block (or expression beggining)
	Thanks to that property, combinators and constaints 
	essentially come in pairs [combinator, constraint], ...

	hence: expression can be represented simply as two arrays:
		- combinators
		- contraints
	for any index i, (i < length):
		constraint[i] is constraint following the combinator at combinator[i]

*/
export type ExpressionParseTape = {
	combinators: Array<ExpressionCombinator>,
	constraints: Array<ConstraintTreeNode>,
}


export namespace ExpressionParseTapeUtils{
	export namespace Display {
		export function asTree(tape: ExpressionParseTape): string {
			const trees: Array<string> = []
		
			for (let i = 0; i < tape.constraints.length; i++){
				const combinator: string = ExpressionCombinator[tape.combinators[i]]

				const root: ConstraintTreeNode = tape.constraints[i];
				const obj: any = ConstraintTreeNodeUtils.Display.treeifyRepr(root);
				
				trees.push(combinator);
				trees.push(treeifyObject(obj, true));

			}
			return trees.join("\n");
		}
		export function asTreeFull(
			tape: ExpressionParseTape,
			tokenStrings: Readonly<Array<string>>,
			tokenMapping: Readonly<Array<number>>,
		): string {
			const trees: Array<string> = []
		
			for (let i = 0; i < tape.constraints.length; i++){
				const combinator: string = ExpressionCombinator[tape.combinators[i]]

				const root: ConstraintTreeNode = tape.constraints[i];
				const obj: any = ConstraintTreeNodeUtils.Display.treeifyReprFull(
					root, tokenStrings, tokenMapping,
				);
				
				trees.push(combinator);
				trees.push(treeifyObject(obj, true));

			}
			return trees.join("\n");
		}
	}
}

export namespace ConstraintTreeNodeUtils {
	export namespace Display {		
		/**
			Converts a consraint tree node into nested object representation 
			that will be possible to display as string with treeify.
		*/
		export function treeifyRepr(node: ConstraintTreeNode): any {
			const [rootIdx, rootVal] = nodeToTreeifyImpl(node);
			return {[rootIdx]: rootVal};
		}
		/**
			Converts a constraint tree nde into nested object representation
			that will be possible to display as string with treeify.

			Unlike function treeifyRepr, includes atom token values in the result
		*/
		export function treeifyReprFull(
			node: ConstraintTreeNode,
			tokenStrings: Readonly<Array<string>>,
			tokenMapping: Readonly<Array<number>>,
		): any {
			const [rootIdx, rootVal] = nodeToTreeifyFullImpl(
				node, tokenStrings, tokenMapping
			);

			// handling special case for "implicit wildcard" constraint
			// which has uniquely special property of range[0] == range[1]
			
			if (node.range[0] == node.range[1]){
				return {[rootIdx]: "(implicit) *"};
			}else{
				return {[rootIdx]: rootVal};
			}

		}		

		/**
			Recursive function that constructs result for the nodeToTreeify function.
		*/
		function nodeToTreeifyImpl(node: ConstraintTreeNode): [string, any] {
			const kindStr: string = ConstraintTreeNodeKind[node.kind];
			const rangeStr = ` [${node.range[0]}, ${node.range[1]}]`;

			const identifier = kindStr + rangeStr;

			const result: any = {};
			
			for(const child of node.children){
				const [childId, childObj] = nodeToTreeifyImpl(child);
				result[childId] = childObj;
			}
	
			return [identifier, result];
		}

		function nodeToTreeifyFullImpl(
			node: ConstraintTreeNode,
			tokenStrings: Readonly<Array<string>>,
			tokenMapping: Readonly<Array<number>>,
		): [string, any]{

			const kindStr: string = ConstraintTreeNodeKind[node.kind];
			const rangeStr = ` [${node.range[0]}, ${node.range[1]}]`;

			const identifier = kindStr + rangeStr;

			// atom case 
			if (node.kind == ConstraintTreeNodeKind.ATOM){
				const token: string = tokenStrings[tokenMapping[node.range[0]]];
				return [identifier, token];
			}
		
			// general case
			const result: any = {};
			
			for(const child of node.children){
				const [childId, childObj] = nodeToTreeifyFullImpl(
					child, tokenStrings, tokenMapping
				);
				result[childId] = childObj;
			}
	
			return [identifier, result];
			
		}
	}
}

// {
//     oranges: {
//         'mandarin': {                       
//             clementine: null,               
//             tangerine: 'so cheap and juicy!'
//         }                                   
//     },                                      
//     apples: {                               
//         'gala': null,                       
//         'pink lady': null
//     }
// }