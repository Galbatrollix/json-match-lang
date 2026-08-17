import {
	type ExpressionParseTape, 
	type ConstraintTreeNode,
	ConstraintTreeNodeKind,
} from "./parser_types.ts"


/**
	This function runs through each constraint abstract syntax tree
	in the tape and elliminates redundant nodes. A node is redundant if:
		- it has only one child that spans exactly the same token range
		OR
		- it is a parenthesis node
	Modifies parse tape in place. Returns nothing.
	
*/
export function postprocessCollapseTreesInPlace(parseTape: ExpressionParseTape): void {
	for (let i = 0; i < parseTape.constraints.length; i++){
		collapseTreeImpl(parseTape.constraints[i]);
	}
}

/**
	Recursively destroys any redundant nodes in constraint syntax tree
	read postprocessCollapseTrees for what counts as redundant node.
	
*/
function collapseTreeImpl(root: ConstraintTreeNode): void {
	const rootIdx = 0;
	const node = [root];
	
	// node[0] is basically used like a pointer to node
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
		// if range is not the same and is not parenthesis, node not elligible for collapsing
		if (!rangeTheSame && !isParenthesis){
			break;
		}
		// node's elligible for collapsing
		node[0] = node[0].children[0];
	}
	
	// recursively invoke this function on all children of collapsed root.
	for (let i = 0; i < node[0].children.length; i++){
		collapseTreeImpl(node[0].children[i]);
	}
	// writing resulting state
	root.kind = node[0].kind;
	root.range = node[0].range;
	root.children = node[0].children;

}
