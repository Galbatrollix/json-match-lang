import * as parser from "./../parse/parser_a_index.ts"

import {arrayExtend} from "./../utils/utils_main.ts"



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

type DepthState = {
	siblingIndex: number,
	siblingData: Map<number, Array<number>>,
};


type HoistState = {
	combinatorIndex: number,
	currentDepth: number,
	depthData: Map<number, DepthState>,
};

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

function goDeeper(state: HoistState): void {
	state.currentDepth += 1;
	state.depthData.set(
		state.currentDepth,
		initDepthState(state.combinatorIndex),
	);
}

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
