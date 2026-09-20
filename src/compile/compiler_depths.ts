import * as parser from "./../parse/parser_a_index.ts"

export function calculateExpressionDepths(
	combinators: Readonly<Array<parser.ExpressionCombinator>>,
): Array<number> | undefined {
	// initializing [0] representing root
	const depths: Array<number> = [0];
	
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
			depths[curr] = depths[prev];
			smallestDepth = Math.min(depths[curr], smallestDepth);
			break;
		case parser.ExpressionCombinator.CHILD:
			depths[curr] = depths[prev] + 1;
			break;
		case parser.ExpressionCombinator.PARENT:
			depths[curr] = depths[prev] - 1;
			smallestDepth = Math.min(depths[curr], smallestDepth);
			break;
		case parser.ExpressionCombinator.DESCENDANT:
			const ok = adjustDepthsInPlace(
				depths, lastDescendant, curr, smallestDepth,
			);
			if (!ok) {
				return undefined;
			}
			
			depths[curr] = depths[prev] + 1;

			// resetting counting variables for next section
			smallestDepth = depths[curr];
			lastDescendant = curr;
			break;
			
		default:
			combinator satisfies never;
		}
	}

	const ok = adjustDepthsInPlace(
		depths, lastDescendant, depths.length, smallestDepth,
	);
	if (!ok) {
		return undefined;
	}

	// slicing dummy root element away.
	return depths.slice(1);
}

/**

	
*/
function adjustDepthsInPlace(
	depths: Array<number>,
	lastDescendant: number | undefined,
	currentSlot: number,
	smallestDepth: number,
): boolean {
	// depth ranges do not need adjusting if depths dont reach as low as root.
	if (smallestDepth >= 1){
		return true;
	}

	// If there was no previous descendant and smallest depth reached below 1,
	// then expression can never match. 
	if (lastDescendant === undefined){
		return false;
	}

	// root reached, increase minimum depth since the last descendant so
	// smallest depth is 1 again

	addConstantToDepthsInPlace(
		depths,
		[lastDescendant, currentSlot],
		- smallestDepth + 1, 
	);
	return true;
	

	
}

/**
	Adds a constant "n" to each entry in depths

	Depths is modified in place.

	Depths is only modified in indexes snapping bounds denoted 
	by indexRange <number, number)
	
*/
function addConstantToDepthsInPlace(
	depths: Array<number>,
	indexRange: [number, number],
	n: number,
): void {
	for (let i = indexRange[0]; i < indexRange[1]; i++){
		depths[i] += n;
	}
}