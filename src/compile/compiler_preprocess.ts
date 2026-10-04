import * as parser from "./../parse/parser_a_index.ts"

import {arrayExtend} from "./../utils/utils_main.ts"

/**
	Hoists constraints blocks to as low indexes as possible,
	based on given array of hoistGroups (arrays of indexes that point to the same item)

	Returns a new array of constraint nodes.
	Returned constraint array is guaranteed to match exactly the same set
	of json trees as its original version.
*/
export function preprocessHoistConstraints(
	constraints: Readonly<Array<parser.ConstraintTreeNode>>,
	hoistGroups: Array<Array<number>>,
): Array<parser.ConstraintTreeNode> {

	const constraintsCopy: Array<parser.ConstraintTreeNode> = Array.from(constraints);
	hoistConstraintsInGroups(constraintsCopy, hoistGroups);
	return constraintsCopy;
}



/**
	Hoists all constraints in each provided group into 
	the lowest index group index.
	
	Hoisting is performed by arranging an AND constraint node
	from all constraints pertaining to the same tree item and putting it
	in the constraint slot of the lowest indexed item in the group.

	Elements other than the hoisting destination
	receive a wildcard constraint element instead.

	The resulting tape is fully equivalent to the input tape
	when it comes to the sets of trees that it will match.

	All operations are performed in-place on constraints array parameter.
*/
function hoistConstraintsInGroups(
	constraints: Array<parser.ConstraintTreeNode>,
	groups: Array<Array<number>>,
){
	for (const group of groups){
		const constraintsToMerge: Array<parser.ConstraintTreeNode> = [];
		for (const idx of group){
			switch(constraints[idx].kind){
			case parser.ConstraintTreeNodeKind.OR:
			case parser.ConstraintTreeNodeKind.ATOM:
			case parser.ConstraintTreeNodeKind.NOT:
				constraintsToMerge.push(constraints[idx]);
				constraints[idx] = makeImplicitConstraintNode();
				break;
			case parser.ConstraintTreeNodeKind.AND:
				arrayExtend(constraintsToMerge, constraints[idx].children);
				constraints[idx] = makeImplicitConstraintNode();
				break;
			default:;
			}
		}

		const firstInGroup = group[0];
		switch(constraintsToMerge.length){
		case 0:
			break;
		case 1:
			constraints[firstInGroup] = constraintsToMerge[0];
			break;
		default:
			constraints[firstInGroup] = makeAndConstraintNode(constraintsToMerge);
		}
		
	}
}
/**
	Creates a new IMPLICIT constraint tree node
	for replacing hoisted constraints.
*/
function makeImplicitConstraintNode(): parser.ConstraintTreeNode {
	return {
		kind: parser.ConstraintTreeNodeKind.IMPLICIT,
	};
}
/**
	Creates a new AND constraint tree node
	for merging hoisted constraints.
*/
function makeAndConstraintNode(
	children: Readonly<Array<parser.ConstraintTreeNode>>,
): parser.ConstraintTreeNode {
	return {
		kind: parser.ConstraintTreeNodeKind.AND,
		children: children,
	};
}