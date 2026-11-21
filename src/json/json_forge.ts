import {
	type JsonSyntaxTree,
	type WritableSyntaxTree,
	makeWritableSyntaxTree,
} from "./json_types.ts"

/**
	Only for forging json syntax trees directly from objects that resemble json
*/
export type JsonLikeValue = string | number | boolean | null |
		JsonLikeValue[] | { [key: string]: JsonLikeValue };

export type JsonIntermediateReprNode = {
	key: string | undefined,
	children: Array<number>,
	parent: number,
	
	nodePointer: JsonLikeValue,
};


//todo: will also return some dummy object to verify results and whatnot
export function forgeJsonSyntaxTree(
	root: JsonLikeValue
): [JsonSyntaxTree, Array<JsonIntermediateReprNode>] {
	const intermediateRepr = makeIntermediateRepr(root);

	const syntaxTree: WritableSyntaxTree = makeWritableSyntaxTree(
		intermediateRepr.length
	);
	
	populateSyntaxTreeCore(syntaxTree, intermediateRepr);
	populateSyntaxTreeChildDepths(syntaxTree, intermediateRepr);

	return [syntaxTree, intermediateRepr];
}


function populateSyntaxTreeChildDepths(
	syntaxTree: WritableSyntaxTree,
	intermediateRepr: Array<JsonIntermediateReprNode>,
): void {
	for (let nodeIdx = intermediateRepr.length - 1; nodeIdx >= 1; nodeIdx--){
		const parentIdx = intermediateRepr[nodeIdx].parent;
		syntaxTree.childDepth[parentIdx] = Math.max(
			syntaxTree.childDepth[parentIdx],
			syntaxTree.childDepth[nodeIdx] + 1,
		);
	}
}

function populateSyntaxTreeCore(
	syntaxTree: WritableSyntaxTree,
	intermediateRepr: Array<JsonIntermediateReprNode>,
): void {
	// all seen strings that must be preserved are written to this map
	const stringToIndex: Map<string, number> = new Map();
	let uniqueStrings = 0;
}


function makeIntermediateRepr(root: JsonLikeValue): Array<JsonIntermediateReprNode> {
	const result: Array<JsonIntermediateReprNode> = [];

	const stack: Array<[
		node: JsonLikeValue,
		key: string | undefined,
		parentIdx: number,
		selfIdx: number,
	]> = [];

	let top = 0;
	let nodesVisited = 0;

	// initializing stack with root elements "key-value pair"
	stack[top++] = [root, undefined, 0, nodesVisited++];

	while (top){
		const [node, key, parentIdx, selfIdx] = stack[--top];
		
		const childIndexes: Array<number> = [];
		for (const [childKey, childValue] of iterOverChildren(node)){
			const childIdx = nodesVisited++;
			stack[top++] = [
				childValue, childKey, selfIdx, childIdx
			];
		
			childIndexes.push(childIdx);
		}
		
		result[selfIdx] = {
			key: key,
			children: childIndexes,
			parent: parentIdx,
			nodePointer: node,
		};
	}
	return result;
}

function * iterOverChildren(
	node: JsonLikeValue
): Generator<[string | undefined, JsonLikeValue], number, void>{
	if (typeof node != "object" || node === null){
		return 0;
	}
	
	if (Array.isArray(node)){
		for (const value of node){
			yield [undefined, value];
		}
		return node.length;
	}else{
		const entries = Object.entries(node);
		for (const [key, value] of entries){
			yield [key, value];
		}
		return entries.length;
	}
	
}