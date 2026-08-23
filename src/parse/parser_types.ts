import {treeifyObject} from "./../vendored/treeify.ts"

import * as lexer from "./../lex/lexer_a_index.ts"

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
	Each node in raw constraint tree must be one one of the following kinds.
*/
export enum ConstraintTreeNodeKind {
	ATOM,             // has always 0 children
	PARENS,           // has always 1 child
	NOT,              // has always 1 child
	AND,              // has at least 1 child
	OR,               // has at least 1 child
	IMPLICIT,         // has always 0 children
}

/**
	Represents raw form of constraint tree that is outputed
	by the parser implementation.
	
	Kind describes type of the tree node.

	Range describes (filtered) index range of tokens
	that spans the tree node and all its children. 
	
	Children array describes 0 or more children of the current node.
*/
export type RawConstraintTreeNode = {
	kind: ConstraintTreeNodeKind,
	range: [number, number],
	children: Array<RawConstraintTreeNode>,	
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
export type RawExpressionParseTape = {
	combinators: Array<ExpressionCombinator>,
	constraints: Array<RawConstraintTreeNode>,
}


/**
	Represents flattened and processed form of constraint tree
	formed from RawConstraintTreeNode after further processing.

	TokenIdx in atom kind item refers to an index in original
	token tape, not a filtered token index. 

*/
export type ConstraintTreeNode = Readonly<
	{
		kind: ConstraintTreeNodeKind.OR,
		children: Readonly<Array<ConstraintTreeNode>>,
	} |	{
		kind: ConstraintTreeNodeKind.AND,
		children: Readonly<Array<ConstraintTreeNode>>,
	} | {
		kind: ConstraintTreeNodeKind.NOT,
		child: ConstraintTreeNode,
	} | {
		kind: ConstraintTreeNodeKind.ATOM,
		tokenIdx: number,
	} | {
		kind: ConstraintTreeNodeKind.IMPLICIT
	}
>

/**
	Primary, immutable output type returned by the parser.	
	It has a structure of list of pairs [combinator, constraint]. 
	It is encoded as such:
	SoA of 2 arrays with .length equal to ExpressionParseTape.pairCount property:
		combinators[i]: ExpressionCombinator enum value for i-th pair.
		constraints[i]: ConstraintTreeNode - root of constraint tree for i-th pair.

*/
export type ExpressionParseTape = Readonly<{
	pairCount: number,
	combinators: Readonly<Array<ExpressionCombinator>>,
	constraints: Readonly<Array<ConstraintTreeNode>>,
}> & { _?: never };

/**
	Contains additional functions for handling expression parse tape values.
*/
export namespace ExpressionParseTapeUtils {
	/**
		Contains functions for display purposes.
	*/
	export namespace Display {
		/**
			Assembles a readable tree representation of expression parse tape.
			Requires its corresponding lexer.TokenTape to be provided as parameter.

			Third parameter - showAtomKinds is optional - if false or not provided,
			the result will have laconic description for ATOM nodes in the tree. If
			true is given, exact token kinds of each ATOM node will be displayed.

			Returns a string with newline separators that can be directly printed.
		*/
		export function asTree(
			parseTape: ExpressionParseTape,
			tokenTape: lexer.TokenTape,
			showAtomKinds?: boolean,
		): string {
			showAtomKinds = !!showAtomKinds;
			const trees: Array<string> = [];

			for (let i = 0; i < parseTape.constraints.length; i++){
				const combinator: string = ExpressionCombinator[parseTape.combinators[i]]

				const root: ConstraintTreeNode = parseTape.constraints[i];
				const obj: any = ConstraintTreeNodeUtils.Display.treeifyRepr(
					root, tokenTape, showAtomKinds
				);
				
				trees.push(combinator);
				trees.push(treeifyObject(obj, true));

			}
			return trees.join("\n");
		}
	}
}
/**
	Contains additional functions for handling ConstraintTreeNode values.
*/
export namespace ConstraintTreeNodeUtils {
	/**
		Contains functions for display purposes.
	*/
	export namespace Display {
		/**
			Converts a constraint tree node into a nested object representation
			that will be possible to display as string with treeify. Or print as 
			an object.
		*/
		export function treeifyRepr(
			node: ConstraintTreeNode,
			tokenTape: lexer.TokenTape,
			showAtomKinds: boolean,
		): any {
			let [rootIdx, rootVal] = treeifyReprImpl(
				node, tokenTape, showAtomKinds, 0
			);
			return {[rootIdx]: rootVal};
			
		}


		function treeifyReprImpl(
			node: ConstraintTreeNode,
			tokenTape: lexer.TokenTape,
			showAtomKinds: boolean,
			childIndex: number,
		): [string, any] {	
			const kindStr: string = ConstraintTreeNodeKind[node.kind];
			const indexStr = `(${childIndex})`;
			let atomKindStr: string = '';
			
			if (showAtomKinds && node.kind == ConstraintTreeNodeKind.ATOM){
				atomKindStr = " " + lexer.TokenKind[tokenTape.tokenKind[node.tokenIdx]];
			}

			const identifier = kindStr + atomKindStr + " " + indexStr;

			// atom case 
			if (node.kind == ConstraintTreeNodeKind.ATOM){
				const token: string = tokenTape.tokenString[node.tokenIdx];
				return [identifier, token];
			}

			// implicit case
			if (node.kind == ConstraintTreeNodeKind.IMPLICIT){
				return [identifier, "(implicit) *"];
			}	
			
			// remaining cases that have children
			let children: Readonly<Array<ConstraintTreeNode>> = [];
			if (node.kind == ConstraintTreeNodeKind.NOT){
				children = [node.child];
			}else{ // and, or cases
				children = node.children;
			}
	
			// constructing result from children recursively
			const result: any = {};
			
			for(let i = 0; i < children.length; i++){
				const child = children[i];
				const [childId, childObj] = treeifyReprImpl(
					child, tokenTape, showAtomKinds, i
				);
				result[childId] = childObj;
			}
	
			return [identifier, result];
		}
	}
}

/**
	Functions for displaying raw variant of
	expression parse tape. Only for testing or debug, 
	shall not be exported in parser index file.
*/
export namespace RawExpressionParseTapeUtils{
	export namespace Display {
		export function asTreeFull(
			tape: RawExpressionParseTape,
			tokenStrings: Readonly<Array<string>>,
			tokenMapping: Readonly<Array<number>>,
		): string {
			const trees: Array<string> = [];
		
			for (let i = 0; i < tape.constraints.length; i++){
				const combinator: string = ExpressionCombinator[tape.combinators[i]]

				const root: RawConstraintTreeNode = tape.constraints[i];
				const obj: any = RawConstraintTreeNodeUtils.Display.treifyRepr(
					root, tokenStrings, tokenMapping,
				);
				
				trees.push(combinator);
				trees.push(treeifyObject(obj, true));

			}
			return trees.join("\n");
		}
	}
}


/**
	Functions for displaying raw variant of
	constraint tree node, only for testing or debug, 
	shall not be exported in parser index file.
*/
export namespace RawConstraintTreeNodeUtils {
	export namespace Display {		
		/**
			Converts a constraint tree nde into nested object representation
			that will be possible to display as string with treeify.
		*/
		export function treifyRepr(
			node: RawConstraintTreeNode,
			tokenStrings: Readonly<Array<string>>,
			tokenMapping: Readonly<Array<number>>,
		): any {
			const [rootIdx, rootVal] = treifyReprImpl(
				node, tokenStrings, tokenMapping
			);

			// handling special case for "implicit wildcard" constraint
			
			if (node.kind == ConstraintTreeNodeKind.IMPLICIT){
				return {[rootIdx]: "(implicit) *"};
			}else{
				return {[rootIdx]: rootVal};
			}

		}		

		function treifyReprImpl(
			node: RawConstraintTreeNode,
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
				const [childId, childObj] = treifyReprImpl(
					child, tokenStrings, tokenMapping
				);
				result[childId] = childObj;
			}
	
			return [identifier, result];
			
		}
	}
}
