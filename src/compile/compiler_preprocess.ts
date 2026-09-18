import * as lexer from "./../lex/lexer_a_index.ts"
import * as parser from "./../parse/parser_a_index.ts"

import {arrayExtend} from "./../utils/utils_main.ts"


/**
	Hoists constraints blocks to as low indexes as possible. 
	(if such transform can be safely performed)

	Returns a new array of constraint nodes.
	Returned constraint array is guaranteed to match exactly the same set
	of json trees as its original version.
*/
export function preprocessHoistConstraints(
	combinators: Readonly<Array<parser.ExpressionCombinator>>,
	constraints: Readonly<Array<parser.ConstraintTreeNode>>,
): Array<parser.ConstraintTreeNode> {

	
	const inDepth = hoistGroupsInDepth(combinators, constraints);
	const inSiblings = hoistGroupsInSiblings(combinators, constraints);
	const hoistGroupsAll: Array<Array<number>> = inDepth.concat(inSiblings);

	const constraintsCopy: Array<parser.ConstraintTreeNode> = Array.from(constraints);
	hoistConstraintsInGroups(constraintsCopy, hoistGroupsAll);
	return constraintsCopy;
}


/**
	Walks the parse tape and finds groups of nodes that
	unambiguously must refer to the same tree item.

	For any such group, all constraints can later
	are hoisted into the element of the lowest index in the tape.

	Function determines what counts as "refering to the same tree item"
	based on depth requirements that can be derived from child and parents operators.
*/
function hoistGroupsInDepth(
	combinators: Readonly<Array<parser.ExpressionCombinator>>,
	constraints: Readonly<Array<parser.ConstraintTreeNode>>,
): Array<Array<number>> {
	const rangeBegginings: Array<number> = [];
	const rangeEnds: Array<number> = [];
	
	rangeBegginings.push(0);
	for (let i = 0; i < combinators.length; i++){
		if(combinators[i] == parser.ExpressionCombinator.DESCENDANT){
			rangeEnds.push(i);
			rangeBegginings.push(i + 1);
		}
	}
	rangeEnds.push(combinators.length);
	
	const hoistGroups: Array<Array<number>> = [];

	for (let pair = 0; pair < rangeBegginings.length; pair++){
		const pairGroups = hoistGroupsInRangeDepth(
			combinators, [rangeBegginings[pair], rangeEnds[pair]]
		);
		arrayExtend(hoistGroups, pairGroups);
	}

	return hoistGroups;
}

/**
	Within the provided index range, groups indexes which's constraints
	refer to unambiguously the same item in the tree.
	Range should span a sequence of only parent, child or sibling combinators.
	Range can also span a 0-length interval.

	Calling function is responsible for filering out and splitting sequence in a
	way that descendant combinators don't get included in range provided to this function.
*/
function hoistGroupsInRangeDepth(
	combinators: Readonly<Array<parser.ExpressionCombinator>>,
	idxRange: [number, number],
): Array<Array<number>> {

	const hoistGroups: Array<Array<number>> = [];	
	const hoistDepthMembers = new Map<number, Array<number>>();
	// relative root is initialized cuz element just before the range
	// may become a hoist target: for example "DUPA >< kupa"
	// (range starts after DUPA element)
	// real root cannot be hoisted to, hence the edge case
	const relativeRootIdx = idxRange[0] - 1;
	if (relativeRootIdx >= 0){
		hoistDepthMembers.set(0, [relativeRootIdx]);
	}


	let depth = 0;
	for (let i = idxRange[0]; i < idxRange[1]; i++){
		
		if (combinators[i] == parser.ExpressionCombinator.CHILD){
			depth += 1;
			// eject previous group and overwrite the slot.
			// if ejected group has more than 1 member, save it to result
			if(hoistDepthMembers.has(depth) && hoistDepthMembers.get(depth)!.length > 1){
				hoistGroups.push(hoistDepthMembers.get(depth)!);
			}
			hoistDepthMembers.set(depth, [i]);
		}else if (combinators[i] == parser.ExpressionCombinator.PARENT){
			depth -= 1;
			// append index to group or create group if it didnt exist
			if(! hoistDepthMembers.has(depth)) hoistDepthMembers.set(depth, []);
			hoistDepthMembers.get(depth)!.push(i);
		}
		
	}
	
	// drain map and append sufficiently large groups to result
	for (const [_, group] of hoistDepthMembers) {
  		if (group.length > 1){
			hoistGroups.push(group);
		}
	}
	
	return hoistGroups;
}

/**
	Same as hoistGroupsInDepth but uses sibling next/previous relations
	to find nodes refering to the same item instead of using child/parent relations.
*/
function hoistGroupsInSiblings(
	combinators: Readonly<Array<parser.ExpressionCombinator>>,
	constraints: Readonly<Array<parser.ConstraintTreeNode>>,
): Array<Array<number>> {
	const rangeBegginings: Array<number> = [];
	const rangeEnds: Array<number> = [];
	
	rangeBegginings.push(0);
	for (let i = 0; i < combinators.length; i++){
		switch(combinators[i]){
		case parser.ExpressionCombinator.SIBLING_PREV:
		case parser.ExpressionCombinator.SIBLING_NEXT:
			break;
		// we are interested only in next-prev sequences
		// everything else terminates the range.
		default:
			rangeEnds.push(i);
			rangeBegginings.push(i + 1);
		}
	}
	rangeEnds.push(combinators.length);
	
	const hoistGroups: Array<Array<number>> = [];

	for (let pair = 0; pair < rangeBegginings.length; pair++){
		const pairGroups = hoistGroupsInRangeSiblings(
			combinators, [rangeBegginings[pair], rangeEnds[pair]]
		);
		arrayExtend(hoistGroups, pairGroups);
	}


	return hoistGroups;
}

/**
	Within the provided index range, groups indexes which's constraints
	refer to unambiguously the same item in the tree.
	Range should span a sequence of only sibling_next and sibling_prev combinators
	Range can also span a 0-length interval.

	Calling function is responsible for filering out and splitting sequence in a
	way that only expected constraints are within the given range.
*/
function hoistGroupsInRangeSiblings(
	combinators: Readonly<Array<parser.ExpressionCombinator>>,
	idxRange: [number, number],
): Array<Array<number>> {
	
	const hoistGroups: Array<Array<number>> = [];	
	const hoistDepthMembers = new Map<number, Array<number>>();
	// relative root is initialized cuz element just before the range
	// may become a hoist target: for example "DUPA +- kupa"
	// (range starts after DUPA element)
	// real root cannot be hoisted to, hence the edge case
	const relativeRootIdx = idxRange[0] - 1;
	if (relativeRootIdx >= 0){
		hoistDepthMembers.set(0, [relativeRootIdx]);
	}

	let depth = 0;
	for (let i = idxRange[0]; i < idxRange[1]; i++){
		
		if (combinators[i] == parser.ExpressionCombinator.SIBLING_NEXT){
			depth += 1;
		}else{ // if (combinators[i] == parser.ExpressionCombinator.SIBLING_PREV)
			depth -= 1;
		}
		
		if(! hoistDepthMembers.has(depth)) hoistDepthMembers.set(depth, []);
		hoistDepthMembers.get(depth)!.push(i);
		
	}
	
	// drain map and append sufficiently large groups to result
	for (const [_, group] of hoistDepthMembers) {
  		if (group.length > 1){
			hoistGroups.push(group);
		}
	}
	
	return hoistGroups;
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