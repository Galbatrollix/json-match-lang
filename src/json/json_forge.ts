import {type JsonSyntaxTree} from "./json_types.ts"

/**
	Only for forging json syntax trees directly from objects that resemble json
*/
export type JsonLikeValue = string | number | boolean | null |
		JsonLikeValue[] | { [key: string]: JsonLikeValue };

type JsonIntermediateReprNode = {
	key: string | undefined,
	children: Array<number>,
	parent: number,
	
	nodePointer: JsonLikeValue,
};



//todo: will also return some dummy object to verify results and whatnot
export function forgeJsonSyntaxTree(root: JsonLikeValue): JsonSyntaxTree {
	const intermediateRepresentation = makeIntermediateRepr(root);
	console.log(intermediateRepresentation);

	return {} as JsonSyntaxTree;
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
	stack[top++] = [root, undefined, NaN, nodesVisited++];

	while (top){
		const [node, key, parentIdx, selfIdx] = stack[--top];
		
		const childIndexes: Array<number> = [];
		for (const [childKey, childValue] of iterOverChildren(node)){
			const childIdx = nodesVisited++;
			stack[top++] = [
				childValue, childKey, selfIdx, childIdx
			];
		
			childIndexes.push(childIdx)
		}
		
		result[selfIdx] = {
			key: key,
			children: childIndexes,
			parent: parentIdx,
			nodePointer: node,
		}
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