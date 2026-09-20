import * as parser from "./../parse/parser_a_index.ts"

export function calculateExpressionDepths(
	combinators: Readonly<Array<parser.ExpressionCombinator>>,
): Array<[number, number]> | undefined {
	// initializing [0,0] representing root
	const depthRanges: Array<[number, number]> = [[0, 1]];
	
	let smallestDepth = 1;
	let lastDescendant: number | undefined = undefined;

	for (let i = 0; i < combinators.length; i++){
		const prev = i;
		const curr = i + 1;
		const combinator = combinators[i];

		switch (combinator){
		case parser.ExpressionCombinator.SIBLING_PREV:
		case parser.ExpressionCombinator.SIBLING_NEXT:
		case parser.ExpressionCombinator.SIBLING_SUBSEQUENT:
		case parser.ExpressionCombinator.SIBLING_PRECEDING:
		case parser.ExpressionCombinator.SIBLING_ANY:
			depthRanges[curr] = [...depthRanges[prev]];
			smallestDepth = Math.min(depthRanges[curr][0], smallestDepth);
			break;
		case parser.ExpressionCombinator.CHILD:
			depthRanges[curr] = [depthRanges[prev][0] + 1, depthRanges[prev][1] + 1];
			break;
		case parser.ExpressionCombinator.PARENT:
			depthRanges[curr] = [depthRanges[prev][0] - 1, depthRanges[prev][1] - 1];
			smallestDepth = Math.min(depthRanges[curr][0], smallestDepth);
			break;
		case parser.ExpressionCombinator.DESCENDANT:
			const ok = adjustDepthRangesInPlace(
				depthRanges, lastDescendant, curr, smallestDepth,
			);
			if (!ok) {
				return undefined;
			}
			
			depthRanges[curr] = [depthRanges[prev][0] + 1, Infinity];

			// resetting counting variables for next section
			smallestDepth = depthRanges[curr][0];
			lastDescendant = curr;
			break;
			
		default:
			combinator satisfies never;
		}
	}

	const ok = adjustDepthRangesInPlace(
		depthRanges, lastDescendant, depthRanges.length, smallestDepth,
	);
	if (!ok) {
		return undefined;
	}

	// slicing dummy root element away.
	return depthRanges.slice(1);
}

/**

	
*/
function adjustDepthRangesInPlace(
	depthRanges: Array<[number, number]>,
	lastDescendant: number | undefined,
	currentSlot: number,
	smallestDepth: number,
): boolean {
	// If there was no previous descendant and smallest depth reached below 1,
	// then expression can never match. 
	if (smallestDepth < 1 && lastDescendant === undefined){
		return false;
	}

	// depth ranges do not need adjusting if depths dont reach as low as root.
	if (smallestDepth >= 1){
		return true;
	}

	// root reached, increase minimum depth since the last descendant so
	// smallest depth is 1 again

	addConstantToRangesInPlace(
		depthRanges,
		[lastDescendant!, currentSlot],
		- smallestDepth + 1, 
	);
	return true;
	
}

/**
	Adds a constant "n" to each entry in depth ranges 
	(value is added to both start and end parts of index range)

	Depth ranges is modified in place.

	DepthRanges is only modified in indexes snapping bounds denoted 
	by indexRange <number, number)
	
*/
function addConstantToRangesInPlace(
	depthRanges: Array<[number, number]>,
	indexRange: [number, number],
	n: number,
): void {
	for (let i = indexRange[0]; i < indexRange[1]; i++){
		depthRanges[i][0] += n;
		depthRanges[i][1] += n;
	}
}