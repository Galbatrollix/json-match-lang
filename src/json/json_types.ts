
// export enum JsonValueKind {
	
// }

export type JsonSyntaxTree = Readonly<{
	// number of nodes in the entire json tree
	// all arrays inside other than "strings" have length == nodeCount
	nodeCount:        number,
	
	// pointers to other nodes in the tree
	parent:           Uint32Array,
	childFirst:       Uint32Array,
	childLast:        Uint32Array,
	siblingNext:      Uint32Array,
	siblingPrevious:  Uint32Array,
	
	// additional data for each that might be handy to narrow down search early and optimize
	// not necessary, to deletion if maintaining it is not worth it
	nodeDepth:        Uint32Array,  // encodes how deep the node is in the tree
	childDepth:       Uint32Array,  // encodes how much deeper the deepest descendant is 
	
	// info about contents of the node 
	valueKind:        Uint8Array,   // encodes JsonValueKind enum values 
	siblingIndex:     Uint32Array,  // encodes "i - 1" as in "i-th child of the parent node"
	stringRefKey:     Uint32Array,  // pointer to strings with key pattern if applicable
	stringRefValue:   Uint32Array,  // pointer to strings with number/string pattern if applicable

	// contains all strings that must be preserved for proper matching
	// this includes: keys (no quotes), string values (no quotes), number values (as is)
	// different length than the length of the tree, multiple pointers may point to a single
	// entry in strings (for example if some key shows up in many places in the json file)
	strings:          Array<string>,
	
}>;