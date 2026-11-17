import * as parser from "./../parse/parser_a_index.ts"

/**
	Creates an array with length equal to the length of 
	expression combinators array.

	Expression combinator with index i must be at least
	"result[i]" levels deep in JSON tree. Root is assigned depth 0,
	so descendant or child of root is assigned minimum depth 1, and so on.

	Function may return undefined instead if the minimum depth levels analysis
	reaches a conclusion that nothing can possibly match a given expression.
	(for example "parent of root" expression cannot match any JSON document)

	Function does not require hoist groups parameter as the current algorithm
	already captures relations between node depths without need
	for reading hoist groups at all.
*/
export function calculateMinimalExpressionDepths(
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
	Creates an array with length equal to the length of 
	expression combinators array.

	Expression combinator with index i must have a descendant at least
	"result[i]" levels deeper in JSON tree. Leaf nodes in json tree 
	are assigned child depth 0.

	Function does not currently take hoist groups nor minDepths but
	it can be further improved using these in the future.
*/
export function calculateExpressionChildDepths(
	combinators: Readonly<Array<parser.ExpressionCombinator>>,
	// todo: later when function is expanded
	// hoistGroups: Array<Array<number>>,
	// minDepths: Readonly<Array<number>>,
): Array<number> {

	// filling "terminals" with 0 - terminals means pairs 
	// that are allowed to match items with 0 child depths.
	const childDepths: Array<number | undefined> = createInitialChildDepths(
		combinators,
	);

	propagateChildDepthsInPlace(combinators, childDepths);

	return childDepths as Array<number>;
}

/**
	Returns a new array of child depths or undefined representing following logic:
	If value is beyond shadow of the doubt allowed to match item with no children:
		then it is filled with 0.
	Otherwise: 
		slot is empty (implicit undefined) 
*/
function createInitialChildDepths(
	combinators: Readonly<Array<parser.ExpressionCombinator>>,
): Array< 0 | undefined> {
	const childDepths: Array< 0 | undefined> = Array(combinators.length);
	
	for (let i = 0; i < combinators.length - 1; i++){
		const left = combinators[i];
		const right = combinators[i + 1];
		
		if (isZeroChildDepth(left, right)){
			childDepths[i] = 0;
 		}
	}		
	// unrolling last item, second parameter is given as dummy 
	// that won't interfere with result
	if (isZeroChildDepth(
		combinators[combinators.length - 1],
		parser.ExpressionCombinator.SIBLING_ANY,
	)){
		childDepths[combinators.length - 1] = 0;
	}


	return childDepths;
}

/**
	Returns true if a parse tape pair is beyond shadow of the doubt
	allowed to match an item with 0 children.

	Curr is expression combinator of current pair, next is epression combinator
	of pair one index higher.
*/
function isZeroChildDepth(
	curr: parser.ExpressionCombinator,
	next: parser.ExpressionCombinator,
): boolean {
	const leftDeeper = curr == parser.ExpressionCombinator.PARENT;
	const rightDeeper = (
		next == parser.ExpressionCombinator.DESCENDANT
		||
		next == parser.ExpressionCombinator.CHILD
	);

	return !leftDeeper && !rightDeeper;
}

/**
	Transforms a "seeded" child Depths array with 0 values and empty slots
	into a valid child depths array.

	Read "createInitialChildDepths" function for more info on initial state.

	childDepths array is modified in place.
*/
function propagateChildDepthsInPlace(
	combinators: Readonly<Array<parser.ExpressionCombinator>>,
	childDepths: Array<number | undefined>,
): void {
	for (let i = 0; i < childDepths.length; i++){
		// triple equals as childDepths[i] may also be undefined
		if (childDepths[i] === 0){
			propagateChildDepthLeft(combinators, childDepths, i);
			propagateChildDepthRight(combinators, childDepths, i);
		}
	}
}

/**
	Propagates child depths starting from 0 seed
	and going to the right as far as possible to do safely.
	Seed index is given as "start" parameter.
*/
function propagateChildDepthLeft(
	combinators: Readonly<Array<parser.ExpressionCombinator>>,
	childDepths: Array<number | undefined>,
	start: number,
): void {
	for (let i = start - 1, depthCounter = 1; i >= 0; i--, depthCounter++){
		const leftShallower = (
			combinators[i + 1] == parser.ExpressionCombinator.DESCENDANT
			||
			combinators[i + 1] == parser.ExpressionCombinator.CHILD
		);

		if (! leftShallower) {
			return;
		}

		if (childDepths[i] !== undefined && childDepths[i]! >= depthCounter){
			return;
		}

		childDepths[i] = depthCounter;
	}
}

/**
	Propagates child depths starting from 0 seed
	and going to the right as far as possible to do safely.
	
	Seed index is given as "start" parameter.
*/
function propagateChildDepthRight(
	combinators: Readonly<Array<parser.ExpressionCombinator>>,
	childDepths: Array<number | undefined>,
	start: number,
): void {
	for (let i = start + 1, depthCounter = 1; i < combinators.length; i++, depthCounter++){
		const rightShallower = combinators[i] == parser.ExpressionCombinator.PARENT;

		if (! rightShallower){
			return;
		}
		
		if (childDepths[i] !== undefined && childDepths[i]! >= depthCounter){
			return;
		}
		childDepths[i] = depthCounter;
	}
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

	Depths is only modified in indexes spanning bounds denoted 
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