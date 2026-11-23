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
	const visitedCombinations = new DenseBitSet2D(json.nodeCount, expr.size);

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
		//console.log(searchStack, stackTop);
		const {nodeIter, nextCombinatorIdx} = searchStack[stackTop];
		const {value: nodeIdx, done: finished} = nodeIter.next();
		// dropping the iterator from the stack if it got exhausted
		if (finished){
			stackTop -= 1;
			continue;
		}
		//console.log("Node " + nodeIdx + " is being tested");
		
		// skipping any processing on already visited (node, combinator) pairs
		const visited: boolean = visitedCombinations.readSet(nodeIdx, nextCombinatorIdx - 1);
		if (visited){
			continue;
		}

		// if node passes assigned constraints then put its iterator on the stack
		// if it passes and also exhausts entire expression, it qualifies as a match
		const expressionExhausted: boolean = nextCombinatorIdx == expr.size;
		const nodeMatches: boolean = nodePassesConstraints(
			expr, nextCombinatorIdx - 1, json, nodeIdx 
		);

		if (!nodeMatches){
			continue;
		}

		if (expressionExhausted){
			matchesFound.push(nodeIdx);
			continue;
		}

	
		searchStack[++stackTop] = {
			nodeIter: iteratorMakers[expr.combinators[nextCombinatorIdx]](json, nodeIdx),
			nextCombinatorIdx: nextCombinatorIdx + 1,
		};
	}

	return matchesFound;
}
