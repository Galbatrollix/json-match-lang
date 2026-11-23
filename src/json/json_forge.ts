import {
	type JsonSyntaxTree,
	type WritableSyntaxTree,
	type JsonIntermediateReprNode,
	type JsonLikeValue,
	makeWritableSyntaxTree,
	JsonValueKind,
} from "./json_types.ts"




//todo: docstring
export function forgeJsonSyntaxTree(
	root: JsonLikeValue
): [JsonSyntaxTree, Array<JsonIntermediateReprNode>] {
	const intermediateRepr = makeIntermediateRepr(root);

	const syntaxTree: WritableSyntaxTree = makeWritableSyntaxTree(
		intermediateRepr.length
	);
	
	writeSyntaxTreeForwardsInPlace(syntaxTree, intermediateRepr);
	writeSyntaxTreeBackwardsInPlace(syntaxTree, intermediateRepr);

	return [syntaxTree, intermediateRepr];
}

/**
	Fills "childDepths" and "descendantLast" arrays in syntax tree SoA.

	Prior state of writable syntax tree is relevant for this function.
	This function assumes that both "childDepths" and "descendantLast"
	arrays are 0-initialized. Contents of other arrays are not relevant.

	This function is separated from "writeSyntaxTreeForwardsInPlace" as it demands
	reverse iteration and skipping a root element, so it couldn't be 
	seamlessly fused with other arrays inside one main loop.
*/
function writeSyntaxTreeBackwardsInPlace(
	syntaxTree: WritableSyntaxTree,
	intermediateRepr: Array<JsonIntermediateReprNode>,
): void {
	for (let nodeIdx = intermediateRepr.length - 1; nodeIdx >= 1; nodeIdx--){
		const parentIdx = intermediateRepr[nodeIdx].parent;

		// writing child depth
		syntaxTree.childDepth[parentIdx] = Math.max(
			syntaxTree.childDepth[parentIdx],
			syntaxTree.childDepth[nodeIdx] + 1,
		);

		// writing last descendant pointer
		syntaxTree.descendantLast[parentIdx] = Math.max(
			syntaxTree.descendantLast[parentIdx],
			syntaxTree.descendantLast[nodeIdx],
			nodeIdx,
		);
	}
}
/**
	Fills all arrays except "childDepths" and "descendantLast" in syntax tree SoA.

	Prior state of writable syntax tree is not relevant.
	Values are filled solely based on given intermediate representation.

	"childDepths" and "descendantLast" arrays are delegated to other function.
	Read "writeSyntaxTreeBackwardsInPlace" for more info.
*/
function writeSyntaxTreeForwardsInPlace(
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
			syntaxTree.childFirst[i] = children[children.length - 1];
			syntaxTree.childLast[i] = children[0];
		}

		// writing node depth
		syntaxTree.nodeDepth[i] = 1 + syntaxTree.nodeDepth[
			intermediateRepr[i].parent
		];
		
		// writing value kind
		const kind: JsonValueKind = determineValueKind(intermediateRepr[i].node);
		syntaxTree.valueKind[i] = kind;
		
		// writing key strings
		const keyString = intermediateRepr[i].key;
		if (keyString !== undefined){
			const stringIdx = assignStringIndex(keyString, stringToIndex);
			stringToIndex.set(keyString, stringIdx);
			syntaxTree.strings[stringIdx] = keyString;
			syntaxTree.stringRefKey[i] = stringIdx;
		}

		// writing value (number or string) strings
		const valueString = stringFromValue(intermediateRepr[i].node, kind);
		if (valueString !== undefined){
			const stringIdx = assignStringIndex(valueString, stringToIndex);
			stringToIndex.set(valueString, stringIdx);
			syntaxTree.strings[stringIdx] = valueString;
			syntaxTree.stringRefValue[i] = stringIdx; 
		}
	}
}

/**
	Returns a json-like value as a string if the value itself is a string or a number.
	In all other cases returns undefined.

	Type resolution is performed using previously computed JsonValueKind value
	passed as a second parameter.
*/
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
/**
	Checks string s against the map containing output string indexes.
	If given string already exists in the map, its index from map is returned.
	Otherwise the function returns the lowest non-negative index that doesn't
	already exist in the map. 
	(which must be current size of map as indexes are counted with increments of 1)
*/
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
/**
	My favourite function in the entire project :)
*/
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

/**
	Creates intermediate json representation from a provided json value.

	This is performed using explosive DFS with a stack.
	This method of creation allows for jamming all sibling items next to each other.
	(In other words, all children of any node are placed on contiguous indexes)
	Find more info in type definition of JsonIntermediateReprNode.

	Standard approach (stack of iterators or recursion) would lead to children
	getting scattered all across the array.

*/
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
	stack[top++] = [[root], undefined, 0, nodesVisited++];

	while (top){
		const [node, key, parentIdx, selfIdx] = stack[--top];
		
		const childIndexes: Array<number> = [];
		const childIterator = iterOverChildren(node);
		for (const [childKey, childValue, relativeChildIdx] of childIterator){
			const absoluteChildIdx = relativeChildIdx + nodesVisited;
			stack[top++] = [
				childValue, childKey, selfIdx, absoluteChildIdx,
			];
			childIndexes.push(absoluteChildIdx);
		}
		// pushing nodes visited by count of the node's children
		nodesVisited += childIndexes.length;
		
		
		result[selfIdx] = {
			key: key,
			children: childIndexes,
			parent: parentIdx,
			node: node,
		};
	}
	return result;
}

/**
	Makes iterator for iterating over children of a selected json-like item.
	Each iteration yields a tuple of [key, value, childIndex]

	Iteration is done in reverse order to generate a proper stack order
	that is essential for certain properties of data structure.

	Returns count of generated items at the end.
	Non iterable json-like items simply terminate right away and return 0.
*/
function * iterOverChildren(
	node: JsonLikeValue
): Generator<[
	key:   string | undefined,
	value: JsonLikeValue,
	index: number,
], number, void> { 
	if (typeof node != "object" || node === null){
		return 0;
	}
	
	if (Array.isArray(node)){
		for (let i = node.length - 1; i >= 0; i--){
			yield [undefined, node[i], i];
		}
		return node.length;
	}else{
		const entries = Object.entries(node);
		for (let i = entries.length - 1; i >= 0; i--){
			const [key, value] = entries[i];
			yield [key, value, i];
		}
		return entries.length;
	}
}