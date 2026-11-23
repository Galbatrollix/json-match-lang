import * as parser from "./../parse/parser_a_index.ts"
import * as json from "./../json/json_a_index.ts"

export type CombinatorIterator = Generator<number, number, void>;
type CombinatorIteratorMaker = (ast: json.JsonSyntaxTree, node: number) => CombinatorIterator;

export const iteratorMakers: Record<
	parser.ExpressionCombinator, CombinatorIteratorMaker
> = Object.assign([], {
	[parser.ExpressionCombinator.DESCENDANT]:         makeDescendantIterator, 
	[parser.ExpressionCombinator.CHILD]:              makeChildIterator,
	[parser.ExpressionCombinator.PARENT]:             makeParentIterator,
	[parser.ExpressionCombinator.SIBLING_NEXT]:       makeSiblingNextIterator,
	[parser.ExpressionCombinator.SIBLING_PREV]:       makeSiblingPreviousIterator,
	[parser.ExpressionCombinator.SIBLING_SUBSEQUENT]: makeSiblingSubsequentIterator,
	[parser.ExpressionCombinator.SIBLING_PRECEDING]:  makeSiblingPrecedingIterator,
	[parser.ExpressionCombinator.SIBLING_ANY]:        makeSiblingAnyIterator,
});


function * makeChildIterator(
	ast: json.JsonSyntaxTree, node: number
): CombinatorIterator {
	const start = ast.childFirst[node];
	const end = ast.childLast[node];

	if (! start){
		return 0;
	}

	for (let idx = start; idx <= end; idx++){
		yield idx;
	}
	
	return 1 + end - start;
}


function * makeDescendantIterator(
	ast: json.JsonSyntaxTree, node: number
): CombinatorIterator {
	const start = ast.childFirst[node];
	const end = ast.descendantLast[node];

	if (! start){
		return 0;
	}

	for (let idx = start; idx <= end; idx++){
		yield idx;
	}
	
	return 1 + end - start;
}

function * makeParentIterator(
	ast: json.JsonSyntaxTree, node: number
): CombinatorIterator {
	if (! ast.parent[node]){
		return 0;
	}
	yield ast.parent[node];
	return 1;
}

function * makeSiblingPreviousIterator(
	ast: json.JsonSyntaxTree, node: number
): CombinatorIterator {
	const parent = ast.parent[node];
	const siblingPreviousExists = (
		parent != 0 && ast.childFirst[parent] < node
	);

	if (siblingPreviousExists){
		yield node - 1;
		return 1;
	}else{
		return 0;
	}
}

function * makeSiblingNextIterator(
	ast: json.JsonSyntaxTree, node: number
): CombinatorIterator {
	const parent = ast.parent[node];
	const siblingNextExists = (
		parent && ast.childLast[parent] > node
	);

	if (siblingNextExists){
		yield node + 1;
		return 1;
	}else{
		return 0;
	}
}

function * makeSiblingSubsequentIterator(
	ast: json.JsonSyntaxTree, node: number
): CombinatorIterator {
	const parent = ast.parent[node];
	const lastChild = ast.childLast[parent];
	if (! parent){
		return 0;
	}

	for (let idx = node + 1; idx <= lastChild; idx++){
		yield idx;
	}
	return lastChild - node;
}

function * makeSiblingPrecedingIterator(
	ast: json.JsonSyntaxTree, node: number
): CombinatorIterator {
	const parent = ast.parent[node];
	const firstChild = ast.childFirst[parent];
	if (! parent){
		return 0;
	}

	for (let idx = firstChild; idx < node; idx++){
		yield idx;
	}
	return node - firstChild;
}

function * makeSiblingAnyIterator(
	ast: json.JsonSyntaxTree, node: number
): CombinatorIterator {
	const parent = ast.parent[node];
	const firstChild = ast.childFirst[parent];
	const lastChild = ast.childLast[parent];
	if (! parent){
		return 0;
	}

	for (let idx = firstChild; idx < node; idx++){
		yield idx;
	}
	for (let idx = node + 1; idx <= lastChild; idx++){
		yield idx;
	}
	return lastChild - firstChild;
}


