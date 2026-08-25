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

	/**
		Contains functions for purposes of debugging and checking 
		validity of ExpressionParseTape instances.
	*/
	export namespace Debug {
		export function integrityCheckBasic(parseTape: ExpressionParseTape): boolean {
			return (
				soaOk(parseTape)
				&&
				constraintsOk(parseTape, Infinity)
				&&
				pairsOk(parseTape)
			);
		}

		export function integrityCheckDeep(
			parseTape: ExpressionParseTape,
			tokenTape: lexer.TokenTape,
		): boolean {
			return (
				soaOk(parseTape)
				&&
				constraintsOk(parseTape, tokenTape.tokenCount)
				&&
				pairsOk(parseTape)
			);

		}
		
		/**
			Returns true only if basic ExpressionParseTape structure is well-formed.
		*/
		function soaOk(parseTape: ExpressionParseTape): boolean {
			return (
				parseTape.pairCount == parseTape.constraints.length
				&&
				parseTape.pairCount == parseTape.combinators.length
			);
		}

		/**
			Returns true only if all constraint trees in parse tape
			are well formed and contain token indexes lesser than tokenCount.
		*/
		function constraintsOk(
			parseTape: ExpressionParseTape,
			tokenCount: number,
		): boolean {
			for (let i = 0; i < parseTape.pairCount; i++){
				const valid: boolean = ConstraintTreeNodeUtils.Debug.integrityCheck(
					parseTape.constraints[i], tokenCount - 1
				);
				if (! valid) return false;
			}
			
			return true;
		}
		/**
			Returns true only if parse tape contains no invalid pairs
			Only invalid pair is implicit descednant combinator paired
			with implicit constraint. No such pair should ever be emitted.
		*/
		function pairsOk(parseTape: ExpressionParseTape): boolean {
			for (let i = 0; i < parseTape.pairCount; i++){
				const constraint = parseTape.constraints[i];
				const combinator = parseTape.combinators[i];
				const fail: boolean = (
					combinator == ExpressionCombinator.DESCENDANT
					&&
					constraint.kind == ConstraintTreeNodeKind.IMPLICIT
				);
				if (fail) return false;
			}
			return true;
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

	/**
		Contains functions for purposes of debugging and checking 
		validity of ConstraintTreeNode instances.
	*/
	export namespace Debug {
		/**
			Returns true if constraint tree structure and contents
			are well-formed. Expects token count of token tape as a second
			parameter to perform additional checks.
		*/
		export function integrityCheck(
			root: ConstraintTreeNode,
			tokenCount: number,
		): boolean {
			if (validImplicitNode(root)){
				return true;
			}else{
				return traverseAndVerify(root, tokenCount - 1);
			}
		}
		
		/**
			Traverses entire constraint tree and looks for anomalies.
			Returns true only if tree structure is organized properly and no
			token index within tree is outside of range <0, maxTokenIdx>.
		
			Performs "explosive DFS traversal" algorithm using explicit stack 
			to not run into a risk of function call stack overflow 
		*/
		function traverseAndVerify(
			root: ConstraintTreeNode, 
			maxTokenIdx: number
		): boolean {
			const stack: Array<[
				node: ConstraintTreeNode,
				parentKind: ConstraintTreeNodeKind,
			]> = [];
		
			let top = 0;
			// parens kind is used as a root's parent dummy item that won't
			// get into conflict with function's logic. 
			stack[top++] = [root, ConstraintTreeNodeKind.PARENS];

			// keep processing until all nodes have been visited and stack becomes empty
			while(top){
				const [node, parentKind] = stack[--top];
	
				// early exit if a problem is found.
				if (!verifyNode(node, parentKind, maxTokenIdx)){
					return false;
				}
				
				// push all children onto the stack
				top = pushChildrenToStack(stack, node, top);
			}
			
			// traversed entire tree without finding erors, everything OK
			return true;
		}


		/**	
			Takes all children of node and writes them to the stack array
			starting at position pointed to by a top parameter.
			Returns a number that points to first slot past the last written child.
			(returned value is essentially a new top)
		*/
		function pushChildrenToStack(
			stack: Array<[ConstraintTreeNode, ConstraintTreeNodeKind]>,
			node: ConstraintTreeNode,
			top: number,
		): number {
			switch(node.kind){
			case ConstraintTreeNodeKind.NOT:
				stack[top++] = [node.child, node.kind];
				return top;
			case ConstraintTreeNodeKind.AND:
			case ConstraintTreeNodeKind.OR:
				for (const child of node.children){
					stack[top++] = [child, node.kind];
				}
				return top;
			default:
				return top;
			}
			
		}
		
		/**
			Returns true if contents of a node are well formed internally
			and in relation to its parent node (kind) and maximum token index
			that is expected in the tree.
		
			If at least 1 aspect is not well-formed, returns false.
			This function re-asserts typescript's type signature because
			constraint trees are constructed by bypassing type system.
		*/
		function verifyNode(
			node: ConstraintTreeNode,
			parentKind: ConstraintTreeNodeKind,
			maxTokenIdx: number,
		): boolean {
			if (typeof node != 'object' || node === null){
				return false;
			}
			
			const hasKind: boolean = Object.keys(node).includes("kind");
			if (! hasKind){
				return false;
			}
			if (! Object.isFrozen(node)){
				return false;
			}
			
			switch (node.kind){
			case ConstraintTreeNodeKind.NOT:
				return verifyNodeNot(node, parentKind);
			case ConstraintTreeNodeKind.AND:
			case ConstraintTreeNodeKind.OR:
				return verifyNodeAndOr(node, parentKind);
			case ConstraintTreeNodeKind.ATOM:
				return verifyNodeAtom(node, maxTokenIdx);
			// implicit cannot exist deep in the tree, it is handled at top level only
			case ConstraintTreeNodeKind.IMPLICIT:
				return false;
			default:
				node satisfies never;
				return false;
			}

		}
		/**
			Verifies integrity of NOT constraint tree node
			beyond TS typesystem "guarantees".	
		*/
		function verifyNodeNot(
			node: ConstraintTreeNode, 
			parentKind: ConstraintTreeNodeKind
		): boolean {
			if (parentKind == ConstraintTreeNodeKind.NOT){
				return false;
			}
			const keys = Object.keys(node);
			if (keys.length != 2){
				return false;
			}

			if (! keys.includes('child')){
				return false;
			}
			return true;
		}
		/**
			Verifies integrity of OR, AND constraint tree nodes
			beyond TS typesystem "guarantees".	
		*/
		function verifyNodeAndOr(
			node: ConstraintTreeNode, 
			parentKind: ConstraintTreeNodeKind
		): boolean {
			if (parentKind == node.kind){
				return false;
			}
			const keys = Object.keys(node);
			if (keys.length != 2){
				return false;
			}

			if (! keys.includes('children')){
				return false;
			}
			//@ts-expect-error
			if (! Array.isArray(node.children)){
				return false;
			}
			//@ts-expect-error
			if (node.children.length < 1){
				return false;
			}
			
			return true;
		}
		/**
			Verifies integrity of ATOM constraint tree node
			beyond TS typesystem "guarantees".	
		*/
		function verifyNodeAtom(
			node: ConstraintTreeNode, 
			maxTokenIdx: number,
		): boolean {
			const keys = Object.keys(node);
			if (keys.length != 2){
				return false;
			}

			if (! keys.includes('tokenIdx')){
				return false;
			}

			//@ts-expect-error
			if (! Number.isInteger(node.tokenIdx)){
				return false;
			}
			
			//@ts-expect-error
			if (node.tokenIdx > maxTokenIdx || node.tokenIdx < 0){
				return false;
			}
			
			return true;
		}
		/**
			Returns true if given constraint tree node is a valid
			implicit node. Shall be called outside tree traversal.
 
			Verifies integrity beyond TS type system "guarantees".
		*/
		function validImplicitNode(node: ConstraintTreeNode): boolean {
			if (typeof node != 'object' || node === null){
				return false;
			}

			if (! Object.isFrozen(node)){
				return false;
			}

			const keys = Object.keys(node);
			const hasKind: boolean = keys.includes("kind");
			if (! hasKind){
				return false;
			}

			if (keys.length != 1){
				return false;
			}

			if (node.kind != ConstraintTreeNodeKind.IMPLICIT){
				return false;
			}
			return true;
		}
	}
}


/*

	UNEXPORTED STUFF ONLY FOR DEBUGGING BELOW

*/


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
				const combinator: string = ExpressionCombinator[tape.combinators[i]];

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
