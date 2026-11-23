export enum JsonValueKind {
	ARRAY,
	OBJECT,
	NULL,
	TRUE,
	FALSE,
	STRING,
	NUMBER,
}

/**
	Only for forging json syntax trees directly from objects that resemble json
	This type is not bulletproof - circular references, NaNs etc are not json.
*/
export type JsonLikeValue = string | number | boolean | null |
		JsonLikeValue[] | { [key: string]: JsonLikeValue };

/**
	A node of intermediate representation of json syntax tree, used when building
	proper syntax tree by forging it from the json-like objects.

	Children and parent properties refer to indexes of other items in the tree (array of nodes)
	Key and node properties contain pieces of the json-like value used to create a node.

	Entire intermediate json representation has a form of array of nodes.
	The complete tree upholds the three following guarantees:
		- Root's parent property is set to 0 (it has no inherent meaning)
		- Index of any node is larger than index of its parent
		- All children of any node must occupy contiguous indexes in the tree

	The latter two guarantees allow traversing the json tree completely without a stack
	for most common operations that need to be performed.

	Warning: contains pointers to nodes of original json-like object
	used to create it. (via node property)
*/
export type JsonIntermediateReprNode = {
	children: Array<number>,
	parent: number,
	
	key: string | undefined,
	node: JsonLikeValue,
};

/**
	Memory optimized SoA tree representation of a json document.
	Its' main purpose is to facilitate matching of json nodes
	with a compiled match expression.

	All member arrays in the tree are of length "nodeCount"

	The sole exception is the "strings" array which instead of content-dependant length.
	It stores information pointed to by "stringRefKey", "stringRefValue" arrays.
	"strings" contains all strings that must be preserved for proper matching.
	This includes: keys (no quotes), string values (no quotes), number values (as is)
	Multiple pointers may point to a single entry in strings 
	(for example if some key or value shows up in many places in the json file)
	
	All siblings are stored contigously in the data structure. 
	All descendants of a node are guaranteed to have higher index than the node itself.
	First item - root - is always at index 0. Pointers to root are considered NULL pointers.
	(Child of a leaf node is going to point to root)

	"stringRefKey", "stringRefValue" arrays hold pointers to "string" array instead of
	a syntax tree node. 0 is valid value there. Value of these for certain nodes may be 
	undefined. Whether index is applicable or not can be infered by examining other 
	properties of selected node (or its parent node).
	
	Sibling index (what is n in "n-th child of its parent") can be infered from parent's
	first child and the fact children are stored contiguously.
	Likewise, whether a node is an array or object value can be infered from parent's value kind.
	
*/
export type JsonSyntaxTree = Readonly<{
	// number of nodes in the entire json tree
	// all arrays inside other than "strings" have length == nodeCount
	nodeCount:        number,
	
	// pointers to other nodes in the tree
	parent:           Readonly<Uint32Array>,
	childFirst:       Readonly<Uint32Array>,
	childLast:        Readonly<Uint32Array>,
	descendantLast:   Readonly<Uint32Array>,
	
	// additional data for each that might be handy to narrow down search early and optimize
	// not necessary, to deletion if maintaining it is not worth it
	nodeDepth:        Readonly<Uint32Array>,  // encodes how deep the node is in the tree
	childDepth:       Readonly<Uint32Array>,  // encodes how much deeper the deepest descendant is 
	
	// info about contents of the node 
	valueKind:        Readonly<Uint8Array>,   // encodes JsonValueKind enum values
	stringRefKey:     Readonly<Uint32Array>,  // pointer to strings with key pattern if applicable
	stringRefValue:   Readonly<Uint32Array>,  // pointer to strings with number/string pattern if applicable

	// contains all strings that must be preserved for proper matching
	strings:          Readonly<Array<string>>,
}> & { _?: never };

/** 
	Writable variant of json syntax tree, only to be used when creating the tree.
	Infered from the creating function to avoid boilerplate repetition.
*/
export type WritableSyntaxTree = ReturnType<typeof makeWritableSyntaxTree>

/**
	Makes a writable template of a syntax tree for a tree of given "nodeCount".

	"strings" array is created empty.
	Length of all other arays is equal to "nodeCount".
	
	All arrays except "stringRefKey", "stringRefValue" are 0-initialized.
	The two exceptions are initialized to Uint32MAX, but could be any value. (its undefined)
	This value was chosen for easy time debugging and reading contents of the tree,
	so undefined cell doesn't resemble a cell with written 0.
*/
export function makeWritableSyntaxTree(nodeCount: number){
	return {
		nodeCount:        nodeCount,

		parent:           new Uint32Array(nodeCount),
		childFirst:       new Uint32Array(nodeCount),
		childLast:        new Uint32Array(nodeCount),
		descendantLast:   new Uint32Array(nodeCount),

		nodeDepth:        new Uint32Array(nodeCount),
		childDepth:       new Uint32Array(nodeCount),

		valueKind:        new Uint8Array(nodeCount),
		stringRefKey:     new Uint32Array(nodeCount).fill(-1),
		stringRefValue:   new Uint32Array(nodeCount).fill(-1),

		strings:          [] as Array<string>,
	};
}
