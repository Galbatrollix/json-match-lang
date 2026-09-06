import * as lexer from "./../lex/lexer_a_index.ts"
import * as parser from "./../parse/parser_a_index.ts"


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
	Performs a bunch of preprocessing transformations on 
	(mutable copy of) ExpressionParseTape instance.

	MutableParseTape given as parameter is modified in place.
*/
export function preprocessInPlace(tape: MutableParseTape): void {
	hoistConstraintsInDepth(tape);
	hoistConstraintsInSiblings(tape);
}

/**
	Walks the parse tape and finds pairs of nodes that
	unambiguously must refer to the same tree item.

	For any such pair (or larger collection), all constraints 
	are hoisted into the element of the lowest index in the tape.

	Hoisting is performed by arranging an AND constraint node
	from all constraints pertaining to the same tree item and putting it
	in the constraint slot of the lowest indexed item in the group.

	Elements other than the hoisting destination
	receive a wildcard constraint element instead.

	The resulting tape is fully equivalent to the input tape
	when it comes to the sets of trees that it will match.

	Function determines what counts as "refering to the same tree item"
	based on depth requirements that can be derived from child and parents operators.
*/
function hoistConstraintsInDepth(tape: MutableParseTape): void {
	const depthBegginings: Array<number> = [];
	const depthEnds: Array<number> = [];
	
	depthBegginings.push(0);
	for (let i = 0; i < tape.pairCount; i++){
		if(tape.combinators[i] == parser.ExpressionCombinator.DESCENDANT){
			depthEnds.push(i);
			depthBegginings.push(i + 1);
		}
	}
	depthEnds.push(tape.pairCount);
		
	
	const hoistGroups: Array<Array<number>> = [];

	for (let pair = 0; pair < depthBegginings.length; pair++){
		
	}

	for(let i =0; i< depthBegginings.length; i++){
		console.log(`[` , depthBegginings[i], depthEnds[i] , `]`);
	}

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
	const relativeRootIdx = idxRange[0] - 1;
	if (relativeRootIdx >= 0){
		hoistDepthMembers.set(0, [relativeRootIdx]);
	}


	let depth = 0;
	for (let i = idxRange[0]; i < idxRange[1]; i++){
		
		switch(tape.combinators[i]){
		default:
			break;
		case parser.ExpressionCombinator.DESCENDANT:
			throw new Error("Fatal internal error, descendant inside a hoist group range");
		case parser.ExpressionCombinator.CHILD:
			depth += 1;
			// eject previous group and overwrite the slot.
			if(hoistDepthMembers.has(depth) && hoistDepthMembers.get(depth)!.length > 1){
				hoistGroups.push(hoistDepthMembers.get(depth)!);
			}
			hoistDepthMembers.set(depth, [i]);

			break;
		case parser.ExpressionCombinator.PARENT:
			depth -= 1;
			// append index to group or create group if it didnt exist
			if(! hoistDepthMembers.has(depth)) hoistDepthMembers.set(depth, []);
			hoistDepthMembers.get(depth)!.push(i);
			break;
		} 
		
	}
	// dupa > kupa > debil < rip >> czort 
	return hoistGroups;
}

/**
	Same as hoistConstraintsInDepth but uses sibling next/previous relations
	to find nodes refering to the same item instead of using child/parent relations.
*/
function hoistConstraintsInSiblings(tape: MutableParseTape): void {

}
