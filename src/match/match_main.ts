// import * as parser from "./../parse/parser_a_index.ts"
import * as compiler from "./../compile/compiler_a_index.ts"
import * as json from "./../json/json_a_index.ts"
import {DenseBitSet2D} from "./../vendored/bitset.ts"

import {iteratorMakers, type CombinatorIterator} from "./match_iterators.ts"
import {nodePassesConstraints} from "./match_constraints.ts"

// only nodes that already matched (or root) end up on an iterator stack!
export function findMatchingJsonNodes(
	expr: compiler.CompiledExpression,
	json: json.JsonSyntaxTree,
): Readonly<Array<number>> {
	const matchesFound: Array<number> = [];
	const visited = new DenseBitSet2D(json.nodeCount, expr.size);

	let stackTop = -1;
	const searchStack: Array<{
		nodeIter: CombinatorIterator, nextCombinatorIdx: number,
	}> = [];
	
	// placing root's child iterator on the stack to kick start the algorithm
	const initialIterator = iteratorMakers[expr.combinators[0]](json, 0);
	searchStack[++stackTop] = {
		nodeIter: initialIterator,
		nextCombinatorIdx: 1,
	};
	
	while (stackTop != -1){
		
	}

	return matchesFound;
}
