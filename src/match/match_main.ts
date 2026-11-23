import * as parser from "./../parse/parser_a_index.ts"
import * as compiler from "./../compile/compiler_a_index.ts"
import * as json from "./../json/json_a_index.ts"
import {DenseBitSet2D} from "./../vendored/bitset.ts"

export function findMatchingJsonNodes(
	expr: compiler.CompiledExpression,
	json: json.JsonSyntaxTree,
): Readonly<Array<number>> {
	const matchesFound: Array<number> = [];
	const visited = new DenseBitSet2D(json.nodeCount, expr.size);

	const searchStack: Array<{currentNode: number, nextCombinator: number}> = [];
	let stackTop = 0;
	
	// placing root on the stack to kick start the algorithm
	searchStack[stackTop++] = {currentNode: 0, nextCombinator: 0};
	
	while (stackTop){
		
	}

	return matchesFound;
}
