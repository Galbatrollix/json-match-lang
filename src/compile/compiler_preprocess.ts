import * as lexer from "./../lex/lexer_a_index.ts"
import * as parser from "./../parse/parser_a_index.ts"

import {arrayExtend} from "./../utils/utils_main.ts"

/**
	A mutable variant of expression parse tape
	used by several preprocessing functions and
	other compiler functions later down the road.
*/
export type MutableParseTape = {
	pairCount: number,
	combinators: Array<parser.ExpressionCombinator>,
	constraints: Array<parser.ConstraintTreeNode>,
};

/**
	Makes a mutable parse tape identical in contents to
	ExpressionParseTape instance given as parameter.
*/
export function mutableParseTapeCopy(tape: parser.ExpressionParseTape): MutableParseTape {
	return {
		pairCount: tape.pairCount,
		combinators: Array.from(tape.combinators),
		constraints: Array.from(tape.constraints),
	};
}


/**
	Hoists constraints blocks to as low indexes as possible. 
	(if such transform can be safely performed)

	MutableParseTape given as parameter is modified in place.
	Transformed mutable parse tape is guaranteed to match exactly the same set
	of json trees as its original version.
*/
export function preprocessHoistConstraints(tape: MutableParseTape): void {
	const inDepth = hoistGroupsInDepth(tape);
	const inSiblings = hoistGroupsInSiblings(tape);
	const hoistGroupsAll: Array<Array<number>> = inDepth.concat(inSiblings);

	hoistConstraintsInGroups(tape, hoistGroupsAll);
}


/**
	Walks the parse tape and finds groups of nodes that
	unambiguously must refer to the same tree item.

	For any such group, all constraints can later
	are hoisted into the element of the lowest index in the tape.

	Function determines what counts as "refering to the same tree item"
	based on depth requirements that can be derived from child and parents operators.
*/
function hoistGroupsInDepth(tape: MutableParseTape): Array<Array<number>> {
	const rangeBegginings: Array<number> = [];
	const rangeEnds: Array<number> = [];
	
	rangeBegginings.push(0);
	for (let i = 0; i < tape.pairCount; i++){
		if(tape.combinators[i] == parser.ExpressionCombinator.DESCENDANT){
			rangeEnds.push(i);
			rangeBegginings.push(i + 1);
		}
	}
	rangeEnds.push(tape.pairCount);
	
	const hoistGroups: Array<Array<number>> = [];

	for (let pair = 0; pair < rangeBegginings.length; pair++){
		const pairGroups = hoistGroupsInRangeDepth(
			tape, [rangeBegginings[pair], rangeEnds[pair]]
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
	tape: MutableParseTape, idxRange: [number, number],
): Array<Array<number>> {

	const hoistGroups: Array<Array<number>> = [];	
	const hoistDepthMembers = new Map<number, Array<number>>();
	// real root cannot be hoisted to, hence the edge case
	// relative root is initialized cuz element just before
	// the range may become a hoist target: for example "DUPA >< kupa"
	// where range starts at child combinator
	const relativeRootIdx = idxRange[0] - 1;
	if (relativeRootIdx >= 0){
		hoistDepthMembers.set(0, [relativeRootIdx]);
	}


	let depth = 0;
	for (let i = idxRange[0]; i < idxRange[1]; i++){
		
		if (tape.combinators[i] == parser.ExpressionCombinator.CHILD){
			depth += 1;
			// eject previous group and overwrite the slot.
			// if ejected group has more than 1 member, save it to result
			if(hoistDepthMembers.has(depth) && hoistDepthMembers.get(depth)!.length > 1){
				hoistGroups.push(hoistDepthMembers.get(depth)!);
			}
			hoistDepthMembers.set(depth, [i]);
		}else if (tape.combinators[i] == parser.ExpressionCombinator.PARENT){
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
function hoistGroupsInSiblings(tape: MutableParseTape): Array<Array<number>> {
	const rangeBegginings: Array<number> = [];
	const rangeEnds: Array<number> = [];
	
	rangeBegginings.push(0);
	for (let i = 0; i < tape.pairCount; i++){
		switch(tape.combinators[i]){
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
	rangeEnds.push(tape.pairCount);
	
	const hoistGroups: Array<Array<number>> = [];

	for (let pair = 0; pair < rangeBegginings.length; pair++){
		const pairGroups = hoistGroupsInRangeSiblings(
			tape, [rangeBegginings[pair], rangeEnds[pair]]
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
	tape: MutableParseTape, idxRange: [number, number],
): Array<Array<number>> {
	
	const hoistGroups: Array<Array<number>> = [];	
	const hoistDepthMembers = new Map<number, Array<number>>();
	// real root cannot be hoisted to, hence the edge case
	// relative root is initialized cuz element just before
	// the range may become a hoist target: for example "DUPA +- kupa"
	// where range starts at child combinator
	const relativeRootIdx = idxRange[0] - 1;
	if (relativeRootIdx >= 0){
		hoistDepthMembers.set(0, [relativeRootIdx]);
	}

	let depth = 0;
	for (let i = idxRange[0]; i < idxRange[1]; i++){
		
		if (tape.combinators[i] == parser.ExpressionCombinator.SIBLING_NEXT){
			depth += 1;
		}else{ // if (tape.combinators[i] == parser.ExpressionCombinator.SIBLING_PREV)
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
*/
function hoistConstraintsInGroups(tape: MutableParseTape, groups: Array<Array<number>>){
	for (const group of groups){
		const constraintsToMerge: Array<parser.ConstraintTreeNode> = [];
		for (const idx of group){
			switch(tape.constraints[idx].kind){
			case parser.ConstraintTreeNodeKind.OR:
			case parser.ConstraintTreeNodeKind.ATOM:
			case parser.ConstraintTreeNodeKind.NOT:
				constraintsToMerge.push(tape.constraints[idx]);
				tape.constraints[idx] = makeImplicitConstraintNode();
				break;
			case parser.ConstraintTreeNodeKind.AND:
				arrayExtend(constraintsToMerge, tape.constraints[idx].children);
				tape.constraints[idx] = makeImplicitConstraintNode();
				break;
			default:;
			}
		}

		const firstInGroup = group[0];
		switch(constraintsToMerge.length){
		case 0:
			break;
		case 1:
			tape.constraints[firstInGroup] = constraintsToMerge[0];
			break;
		default:
			tape.constraints[firstInGroup] = makeAndConstraintNode(constraintsToMerge);
		}
		
	}
}
/**
	Creates a new implicit constraint tree node
	for replacing hoisted constraints.
*/
function makeImplicitConstraintNode(): parser.ConstraintTreeNode {
	return {
		kind: parser.ConstraintTreeNodeKind.IMPLICIT,
	};
}
/**
	Creates a new and constraint tree node
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