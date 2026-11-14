import * as parser from "./../parse/parser_a_index.ts"


/**
	Analyzes combinators sequence in the expression and 
	arranges any expression indicies that point into unambigously the same
	items in match tree into groups.

	Array of such groups is returned. 
	(Each group is an array of indexes that all point into the same item in tree)

	The groups can be used for hoisting optimization and can aid other
	compilation algorithms.
*/
export function getExpressionHoistGroups(
	combinators: Readonly<Array<parser.ExpressionCombinator>>,
): Array<Array<number>> {
	const resultGroups: Array<Array<number>>  = [];
	const state = initHoistState();

	for(const combinator of combinators){
		state.combinatorIndex += 1;
	
		switch (combinator){
		case parser.ExpressionCombinator.CHILD:
			goDeeper(state);
			break;
		case parser.ExpressionCombinator.PARENT:
			goShallower(state, resultGroups);
			break;
		case parser.ExpressionCombinator.SIBLING_NEXT:
			moveSiblingIndex(state, 1);
			break;
		case parser.ExpressionCombinator.SIBLING_PREV:
			moveSiblingIndex(state, -1);
			break;
		case parser.ExpressionCombinator.DESCENDANT:
			ejectAllDepths(state, resultGroups);
			break;
		case parser.ExpressionCombinator.SIBLING_SUBSEQUENT:
		case parser.ExpressionCombinator.SIBLING_PRECEDING:
		case parser.ExpressionCombinator.SIBLING_ANY:
			resetCurrentDepth(state, resultGroups);
			break;
		default: 
			combinator satisfies never;
		}
	}

	ejectAllDepths(state, resultGroups);
	return resultGroups;
}


/**
	Hoist state represents entirety of hoist group
	algorithm's function state.

	A valid instance of hoist state has at least
	one entry in depthData map corresponding to current depth value.
	And DepthState inside that entry must have at least one entry 
	that corresponds to its contained sibling index.
	Value of that entry can be an empty array.

	Each siblingData entry in DepthState denotes a group of combinator
	indexes that unambiguously point to the same item. 
	
	The algorithm manipulates hoist state by updating combinator index
	, by creating new depths/sibling indexes
	, by ejecting depths or sibling indexes to result,
	moving depth and sibling index pointers around 
	and adding each combinator index to its appropriate group.

*/
type HoistState = {
	combinatorIndex: number,
	currentDepth: number,
	depthData: Map<number, DepthState>,
};

type DepthState = {
	siblingIndex: number,
	siblingData: Map<number, Array<number>>,
};

/**
	Returns initial state for kicking off the beggining
	of hoist group algorithm. Sibling index is initially empty
	as root item cannot participate in hoisting.
*/
function initHoistState(): HoistState {
	const result =  {
		combinatorIndex: -1,
		currentDepth: 0,
		depthData: new Map(),
	};
	
	result.depthData.set(
		0,
		{
			siblingIndex: 0,
			siblingData: new Map([[0, []]]),
		}
	)
	return result;
}

function initDepthState(combinatorIndex: number): DepthState {
	return {
		siblingIndex: 0,
		siblingData: new Map([
			[0, [combinatorIndex]],

		]),
	}
}


/**
	Appends contents of a siblingData entry from hoist state structure
	into resultGroups output.
	
	Any group located in siblingData that is too small (less than 2 elements),
	is not appended to the result.
*/
function drainSiblingDataToResult(
	siblingData: Map<number, Array<number>>,
	resultGroups: Array<Array<number>>,
): void {
	for (const [_, group] of siblingData){
		if (group.length > 1){
			resultGroups.push(group);
		}
	}
}

/**
	Drains sibling data located under current depth to the output
	and resets depthData entry to be initialized only with currently
	set combinator index. 

	Used when sibling continuity is broken
	but the depth continuity remains intact.
	
*/
function resetCurrentDepth(
	state: HoistState,
	resultGroups: Array<Array<number>>,
): void {
	drainSiblingDataToResult(
		state.depthData.get(state.currentDepth)!.siblingData,
		resultGroups,
	);
	state.depthData.set(
		state.currentDepth,
		initDepthState(state.combinatorIndex),
	);
}
/**
	Drains all groups in data structure on all depth levels to the output.
	Reinitializes the state of the algorithm at the current state.combinatorIndex
	on depth 0 sibling index 0.

	Used on descedndant combinator as that combinator removes any possibility
	of unambiguous continuity between adjacent groups.
	Also used after the algorithm finished running to drain any remaining unejected
	groups into the result array.
*/
function ejectAllDepths(
	state: HoistState,
	resultGroups: Array<Array<number>>,
): void {
	// drain map and append sufficiently large groups to result
	for (const [_, depth] of state.depthData) {
		drainSiblingDataToResult(depth.siblingData, resultGroups);
	}
	// reset state
	state.currentDepth = 0;
	state.depthData = new Map();
	state.depthData.set(
		state.currentDepth,
		initDepthState(state.combinatorIndex),
	);
}

/**
	Moves algorithm's state along the sibling index axis by one.
	No group is ejected as both current and previous node might get revisited
	in the future - no continuity is broken.

	Since the operation is symetric for sibling previous and sibling next,
	the function takes a direction parameter to differentiate between the two
	without duplicating code unneccessarily. -1 is for previous +1 is for next.

*/
function moveSiblingIndex(
	state: HoistState,
	direction: -1 | 1,
): void {
	const depthState = state.depthData.get(state.currentDepth)!;
	depthState.siblingIndex += direction;

	const exists: boolean = depthState.siblingData.has(depthState.siblingIndex);
	if (exists){
		depthState.siblingData.get(depthState.siblingIndex)!.push(state.combinatorIndex);
	}else{
		depthState.siblingData.set(depthState.siblingIndex, [state.combinatorIndex]);
	}
}

/**
	Moves algorithm's state 1 depth deeper. 
	As as groups of shallower depth can still be revisited,
	this operation doesn't eject any groups.
	
	Used exclusively in operator child.
*/
function goDeeper(state: HoistState): void {
	state.currentDepth += 1;
	state.depthData.set(
		state.currentDepth,
		initDepthState(state.combinatorIndex),
	);
}
/**
	Moves algorithm's state 1 depth shallower.
	As groups on deeper depth cannot be revisited unambiguously,
	they are drained into the result.

	Only used on combinator parent.
*/
function goShallower(
	state: HoistState,
	resultGroups: Array<Array<number>>,
): void {
	// current depth cannot ever be reentered so its ejected.
	drainSiblingDataToResult(
		state.depthData.get(state.currentDepth)!.siblingData,
		resultGroups,
	);
	state.depthData.delete(state.currentDepth);

	state.currentDepth -= 1;

	const exists: boolean = state.depthData.has(state.currentDepth);
	if (exists){   // if stuff exists in shallower depth, then append to it,
		const {siblingIndex, siblingData} = state.depthData.get(state.currentDepth)!;
		siblingData.get(siblingIndex)!.push(state.combinatorIndex);
	}else{         // if shallower entry doesnt exist, make a new one
		state.depthData.set(
			state.currentDepth,
			initDepthState(state.combinatorIndex),
		);
	}	
}
