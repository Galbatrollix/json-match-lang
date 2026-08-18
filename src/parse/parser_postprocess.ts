import {
	type RawExpressionParseTape, 
	type RawConstraintTreeNode,
	ConstraintTreeNodeKind,
} from "./parser_types.ts"


/**
	This function runs through each constraint abstract syntax tree
	in the tape and elliminates redundant nodes. A node is redundant if:
		- it has only one child that spans exactly the same token range
		OR
		- it is a parenthesis node
		OR
		- it is a negation node with a negation node child 
		(both nodes - parent and child - are considered redundant in this case)
		OR
		- it is an and node that has an and node parent
		OR
		- it is a or node that has a or node parent

	Applies multiple transformations on the tree in an order that ensures
	end result has no redundant nodes as per above description.
	
	Modifies raw parse tape in place. Returns nothing.
	
*/
export function postprocessCollapseTreesInPlace(parseTape: RawExpressionParseTape): void {
	for (let i = 0; i < parseTape.constraints.length; i++){
		collapseTreeStageOne(parseTape.constraints[i]);
		collapseTreeStageTwo(parseTape.constraints[i]);
		collapseTreeStageThree(parseTape.constraints[i]);
	}
}

/**
	Recursively destroys any parenthesis nodes or nodes
	that have only 1 child that spans the exact same token range.
*/
function collapseTreeStageOne(root: RawConstraintTreeNode): void {
	const node = [root];
	// node[0] is basically used like a pointer to node
	// todo refactor to somehting like "working root"
	for (;;) {
		const rootRange: [number, number] = node[0].range;

		// if node has multiple children it is not elligible for collapsing
		if (node[0].children.length != 1){
			break;
		}
		const childRange: [number, number] = node[0].children[0].range;
		const rangeTheSame: boolean = (
			rootRange[0] == childRange[0] 
			&& 
			rootRange[1] == childRange[1]
		)
		const isParenthesis: boolean = node[0].kind == ConstraintTreeNodeKind.PARENS;

		// node is elligible for collapsing only if it has the same range or it is parenthesis
		if (!rangeTheSame && !isParenthesis){
			break;
		}
		node[0] = node[0].children[0];
	}
	
	// recursively invoke this function on all children of collapsed root.
	for (let i = 0; i < node[0].children.length; i++){
		collapseTreeStageOne(node[0].children[i]);
	}
	// writing resulting state
	root.kind = node[0].kind;
	root.range = node[0].range;
	root.children = node[0].children;
}


/**
	Recursively destroys any duplicate NOT nodes.
*/
function collapseTreeStageTwo(root: RawConstraintTreeNode): void {
	const node = [root];
	// node[0] is basically used like a pointer to node
	for (;;) {
		
		// nots always have a single child, so via short circuit this is safe
		const pairOfNots: boolean = (
			node[0].kind == ConstraintTreeNodeKind.NOT 
			&&
			node[0].children[0].kind == ConstraintTreeNodeKind.NOT
		);
			
		if (!pairOfNots){
			break;
		}
		// if we got a pair of nots, replace fist not with its grandchild.
		node[0] = node[0].children[0].children[0];
	}
	
	// recursively invoke this function on all children of collapsed root.
	for (let i = 0; i < node[0].children.length; i++){
		collapseTreeStageTwo(node[0].children[i]);
	}
	// writing resulting state
	root.kind = node[0].kind;
	root.range = node[0].range;
	root.children = node[0].children;
}


/**
	Recursively merges AND nodes that are children of AND parents
	into their parents. Likewise with OR nodes.
*/
function collapseTreeStageThree(root: RawConstraintTreeNode): void {
	//@ts-ignore
	const _unused = root;
}

