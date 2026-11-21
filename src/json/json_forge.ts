import {
	type JsonSyntaxTree,
	type WritableSyntaxTree,
	makeWritableSyntaxTree,
	JsonValueKind,
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

	// node depth of root is primed to -1 for the algorithm to properly fill it to 0
	// uint32(-1) wraps around back and forth so all good
	syntaxTree.nodeDepth[0] = -1;

	for (let i = 0; i < intermediateRepr.length; i++){
		// writing parent pointer
		syntaxTree.parent[i] = intermediateRepr[i].parent;

		// writing children pointers
		const children = intermediateRepr[i].children;
		if (children.length){
			syntaxTree.childFirst[i] = children[0];
			syntaxTree.childLast[i] = children[children.length - 1];
		}

		// writing node depth
		syntaxTree.nodeDepth[i] = 1 + syntaxTree.nodeDepth[
			intermediateRepr[i].parent
		];
		
		// writing value kind
		const kind: JsonValueKind = determineValueKind(intermediateRepr[i].nodePointer);
		syntaxTree.valueKind[i] = kind;
		
		// writing key strings
		const keyString = intermediateRepr[i].key;
		if (keyString !== undefined){
			const keyIdx = assignStringIndex(keyString, stringToIndex);
			stringToIndex.set(keyString, keyIdx);
			syntaxTree.strings[keyIdx] = keyString;
			syntaxTree.stringRefKey[i] = keyIdx;
		}

		// writing value (number or string) strings
		const valueString = stringFromValue(intermediateRepr[i].nodePointer, kind);
		if (valueString !== undefined){
			const valueIdx = assignStringIndex(valueString, stringToIndex);
			stringToIndex.set(valueString, valueIdx);
			syntaxTree.strings[valueIdx] = valueString;
			syntaxTree.stringRefValue[i] = valueIdx; 
		}
	}
}


function stringFromValue(node: JsonLikeValue, kind: JsonValueKind): string | undefined {
	switch(kind){
	case JsonValueKind.NUMBER: 
		return (node as number).toString();
	case JsonValueKind.STRING: 
		return node as string;
	default:
		return undefined;
	}
}

function assignStringIndex(
	s: string,
	stringToIndex: Map<string, number>,
): number {
	const index = stringToIndex.get(s);
	if (index === undefined){
		return stringToIndex.size;
	}else{
		return index;	
	}
}	

function determineValueKind(node: JsonLikeValue): JsonValueKind {
	switch(node){
	case null:  return JsonValueKind.NULL;
	case true:  return JsonValueKind.TRUE;
	case false: return JsonValueKind.FALSE;
	}

	switch(typeof node){
	case "number": return JsonValueKind.NUMBER;
	case "string": return JsonValueKind.STRING;
	case "object": return Array.isArray(node) ? JsonValueKind.ARRAY : JsonValueKind.OBJECT;
	}
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