export enum JsonValueKind {
	ARRAY,
	OBJECT,
	NULL,
	TRUE,
	FALSE,
	STRING,
	NUMBER,
}

export type JsonSyntaxTree = Readonly<{
	// number of nodes in the entire json tree
	// all arrays inside other than "strings" have length == nodeCount
	nodeCount:        number,
	
	// pointers to other nodes in the tree
	parent:           Readonly<Uint32Array>,
	childFirst:       Readonly<Uint32Array>,
	childLast:        Readonly<Uint32Array>,
	// Sibling next and previous pointers are not needed as all siblings are stored
	// contigously in the data structure. 
	// Likewise, sibling index can also be infered from that, by consulting parent node.
	
	// additional data for each that might be handy to narrow down search early and optimize
	// not necessary, to deletion if maintaining it is not worth it
	nodeDepth:        Readonly<Uint32Array>,  // encodes how deep the node is in the tree
	childDepth:       Readonly<Uint32Array>,  // encodes how much deeper the deepest descendant is 
	
	// info about contents of the node 
	valueKind:        Readonly<Uint8Array>,   // encodes JsonValueKind enum values
	stringRefKey:     Readonly<Uint32Array>,  // pointer to strings with key pattern if applicable
	stringRefValue:   Readonly<Uint32Array>,  // pointer to strings with number/string pattern if applicable

	// contains all strings that must be preserved for proper matching
	// this includes: keys (no quotes), string values (no quotes), number values (as is)
	// different length than the length of the tree, multiple pointers may point to a single
	// entry in strings (for example if some key shows up in many places in the json file)
	strings:          Readonly<Array<string>>,
}> & { _?: never };

export type WritableSyntaxTree = ReturnType<typeof makeWritableSyntaxTree>

export function makeWritableSyntaxTree(nodeCount: number){
	return {
		nodeCount:        nodeCount,

		parent:           new Uint32Array(nodeCount),
		childFirst:       new Uint32Array(nodeCount),
		childLast:        new Uint32Array(nodeCount),
	
		nodeDepth:        new Uint32Array(nodeCount),
		childDepth:       new Uint32Array(nodeCount),

		valueKind:        new Uint8Array(nodeCount),
		stringRefKey:     new Uint32Array(nodeCount),
		stringRefValue:   new Uint32Array(nodeCount),

		strings:          [] as Array<string>,
	};
}
