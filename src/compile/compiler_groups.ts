import * as parser from "./../parse/parser_a_index.ts"

import {arrayExtend} from "./../utils/utils_main.ts"



// TODO: currently the hoist groups are not as good as they can be.
// It would be best to merge depth and sibling -based group finders
// into a one, more general function.


/**
	Analyzes combinators sequence in the expression and 
	arranges any expression indicies that point into unambigously the same
	items in match tree into groups.

	Array of such groups is returned. 
	(Each group is itself an array if indexes that all point into the same item in tree)

	The groups can be used for hoisting optimization and can aid other
	compilation algorithms.
*/
export function getExpressionHoistGroups(
	combinators: Readonly<Array<parser.ExpressionCombinator>>
): Array<Array<number>>{
	const inDepth = hoistGroupsInDepth(combinators);
	const inSiblings = hoistGroupsInSiblings(combinators);

	return inDepth.concat(inSiblings);
}

/**
	Walks the parse tape and finds groups of nodes that
	unambiguously must refer to the same tree item.

	Function determines what counts as "refering to the same tree item"
	based on depth requirements that can be derived from child and parents operators.
*/
function hoistGroupsInDepth(
	combinators: Readonly<Array<parser.ExpressionCombinator>>,
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