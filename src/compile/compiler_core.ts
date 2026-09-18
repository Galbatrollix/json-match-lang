import * as lexer from "./../lex/lexer_a_index.ts"
import * as parser from "./../parse/parser_a_index.ts"
import {
	type CompiledConstraint,
	type CompiledConstraintNode,
	type CompiledConstraintData,
	CompiledConstraintDataKind,
	type TrivialValueProperties,

} from "./compiler_types.ts"

/**
	Creates an array of compiled constraints based on array
	of parser emitted constraint nodes and token tape contents.
*/
export function compileConstraints(
	constraints: Readonly<Array<parser.ConstraintTreeNode>>, tokenTape: lexer.TokenTape
): Array<CompiledConstraint>{
	
	const compiled: Array<CompiledConstraint> = [];
	for(let i = 0; i < constraints.length; i++){
		compiled.push(
			compileSingleConstraint(constraints[i], tokenTape),
		);
	}
	
	return compiled;
}

/**
	By performing a Kahn's algorithm compiles 
	constraint tree into compiled constraint.

*/
function compileSingleConstraint(
	root: parser.ConstraintTreeNode,
	tokenTape: lexer.TokenTape,
): CompiledConstraint {

	//console.log(root);
	const compiledConstraints: Array<CompiledConstraintNode> = [];

	const [nodes, parents]: [
		Array<parser.ConstraintTreeNode>, Array<number>
	] = getConstraintNodesAndParents(root);
	const children: Array<Array<number>> = getConstraintChildren(parents);

	const incomingEdges: Uint32Array = getIncomingEdges(parents);
	const workingNodes: Array<number> = initialWorkingNodes(incomingEdges);
	let workingNodeCount = workingNodes.length;

	while(workingNodeCount){
		const poppedNodeIdx = workingNodes[--workingNodeCount];
		
		const compiled = compileConstraintNode(
			nodes[poppedNodeIdx],
			parents[poppedNodeIdx],
			children[poppedNodeIdx],
			tokenTape,
		);
		compiledConstraints[poppedNodeIdx] = compiled;

		//console.log(poppedNodeIdx, compiled.properties);

		const parentIdx = parents[poppedNodeIdx];
		incomingEdges[parentIdx] -= 1;
		if (incomingEdges[parentIdx] == 0){
			workingNodes[workingNodeCount++] = parentIdx;
		}
	}

	return compiledConstraints;
}


/**
	Rearranges the constraint tree into nodes array and
	parents array. Nodes contains all nodes in the constraint tree,
	whereas parent[i] holds index of node i's parent in the node array.
*/
function getConstraintNodesAndParents(root: parser.ConstraintTreeNode):
	[nodes: Array<parser.ConstraintTreeNode>, parents: Array<number>] {
	
	const iter = parser.ConstraintTreeNodeUtils.Misc.iter(root);
	const nodes: Array<parser.ConstraintTreeNode> = [];
	const parents: Array<number> = [];
	
	for (const [node, parent] of iter){
		nodes.push(node);
		parents.push(parent);
	}
	return [nodes, parents];
}
/**
	Creates a mapping from node index to indexes of all its children based on
	parents array given as parameter. 
	(parents array maps child index to its parent's index)
*/
function getConstraintChildren(parents: Readonly<Array<number>>): Array<Array<number>>{
	const childrenMapping: Array<Array<number>> = [];

	// initializing empty arrays first
	for (let i = 0; i < parents.length; i++){
		childrenMapping[i] = [];
	}
	// filling children indexes 
	for (let i = 0; i < parents.length; i++){
		const parentIdx = parents[i];
		// NaN as parent just means its the root element, it can be safely ignored
		if (Number.isNaN(parentIdx)) continue;
	
		childrenMapping[parentIdx].push(i);
	}

	return childrenMapping;
}

/**
	Creates an incoming edges array based on node parents mapping array.
	Incoming edges is "how many children this node has".
	
	Incoming edges array is crurcial for kahn's algorithm operation.
*/
function getIncomingEdges(parents: Readonly<Array<number>>): Uint32Array {
	const result = new Uint32Array(parents.length);
	for (const parentIdx of parents){
		result[parentIdx] += 1;
	}
	return result;
}

/**
	Creates array of all node indexes that have no incoming edges
	for kickstarting kahn's algorithm.
*/
function initialWorkingNodes(incomingEdges: Uint32Array): Array<number> {
	const result: Array<number> = [];
	for (let i = 0; i < incomingEdges.length; i++){
		if (incomingEdges[i] == 0){
			result.push(i);
		}
	}
	return result;
}

/**
	Compiles a single constraint node.
*/
function compileConstraintNode(
	node: parser.ConstraintTreeNode,
	parent: number,
	children: Readonly<Array<number>>,
	tokenTape: lexer.TokenTape,
): CompiledConstraintNode {
	
	let nodeData = {} as CompiledConstraintData;

	switch(node.kind){
	case parser.ConstraintTreeNodeKind.ATOM:
		nodeData = compileNodeAtom(
			tokenTape.tokenKind[node.tokenIdx],
			tokenTape.tokenString[node.tokenIdx],
		);
		break;
	case parser.ConstraintTreeNodeKind.NOT:
		nodeData = compileNodeNot(); 
		break;
	case parser.ConstraintTreeNodeKind.AND:
		nodeData = compileNodeAnd(); 
		break;
	case parser.ConstraintTreeNodeKind.OR:
		nodeData = compileNodeOr(); 
		break;
	case parser.ConstraintTreeNodeKind.IMPLICIT:
		nodeData = compileNodeImplicit(); 
		break;
	default:
		node satisfies never;
	}
	
	return {
		parent: parent,
		children: children,
		data: nodeData,
	};
	
}


function compileNodeOr(): CompiledConstraintData {
	return {kind: CompiledConstraintDataKind.OR};
}

function compileNodeAnd(): CompiledConstraintData {
	return {kind: CompiledConstraintDataKind.AND};
}


function compileNodeNot(): CompiledConstraintData {
	return {kind: CompiledConstraintDataKind.NOT};
}

function compileNodeImplicit(): CompiledConstraintData {
	// implicit must be the same as wildcard all for all intents and purposes.
	return {kind: CompiledConstraintDataKind.WILDCARD};
}
type Writable<T> = { -readonly [Key in keyof T]: T[Key] };

function compileNodeAtom(
	tokenKind: lexer.TokenKind, tokenString: string
): CompiledConstraintData {
	let trivialProps: Writable<TrivialValueProperties>;

	switch(tokenKind){
	default:
		throw new Error("Fatal compiler error, unexpected enum variant."); 
	case lexer.TokenKind.WILDCARD_ALL:
		return {kind: CompiledConstraintDataKind.WILDCARD};
	// cases below are trivial value constraints
	case lexer.TokenKind.VALUE_TYPE_STRING:
		trivialProps = trivialPropertiesFalseInit();
		trivialProps.allowString = true;
		return {kind: CompiledConstraintDataKind.VALUE_TRIVIAL, properties: trivialProps};
	case lexer.TokenKind.VALUE_TYPE_NUMBER:
		trivialProps = trivialPropertiesFalseInit();
		trivialProps.allowNumber = true;
		return {kind: CompiledConstraintDataKind.VALUE_TRIVIAL, properties: trivialProps};
	case lexer.TokenKind.VALUE_TYPE_ARRAY:
		trivialProps = trivialPropertiesFalseInit();
		trivialProps.allowArr = true;
		return {kind: CompiledConstraintDataKind.VALUE_TRIVIAL, properties: trivialProps};
	case lexer.TokenKind.VALUE_TYPE_OBJECT:
		trivialProps = trivialPropertiesFalseInit();
		trivialProps.allowObj = true;
		return {kind: CompiledConstraintDataKind.VALUE_TRIVIAL, properties: trivialProps};
	case lexer.TokenKind.VALUE_EXACT_NULL:
		trivialProps = trivialPropertiesFalseInit();
		trivialProps.allowNull = true;
		return {kind: CompiledConstraintDataKind.VALUE_TRIVIAL, properties: trivialProps};
	case lexer.TokenKind.VALUE_EXACT_TRUE:
		trivialProps = trivialPropertiesFalseInit();
		trivialProps.allowTrue = true;
		return {kind: CompiledConstraintDataKind.VALUE_TRIVIAL, properties: trivialProps};
	case lexer.TokenKind.VALUE_EXACT_FALSE:
		trivialProps = trivialPropertiesFalseInit();
		trivialProps.allowFalse = true;
		return {kind: CompiledConstraintDataKind.VALUE_TRIVIAL, properties: trivialProps};
	case lexer.TokenKind.VALUE_TYPE_BOOLEAN:
		trivialProps = trivialPropertiesFalseInit();
		trivialProps.allowFalse = true;
		trivialProps.allowTrue = true;
		return {kind: CompiledConstraintDataKind.VALUE_TRIVIAL, properties: trivialProps};
	case lexer.TokenKind.VALUE_TYPE_WILDCARD:
		trivialProps = trivialPropertiesTrueInit();
		trivialProps.allowArr = false;
		trivialProps.allowObj = false;
		return {kind: CompiledConstraintDataKind.VALUE_TRIVIAL, properties: trivialProps};
	// cases below are sibling index constraints
	case lexer.TokenKind.WILDCARD_ARRAY:
		return {
			kind: CompiledConstraintDataKind.INDEX,
			arrAllowed: true,
			objAllowed: false,
			siblingIndex: undefined,
		};
	case lexer.TokenKind.WILDCARD_OBJECT:
		return {
			kind: CompiledConstraintDataKind.INDEX,
			arrAllowed: false,
			objAllowed: true,
			siblingIndex: undefined,
		};
	case lexer.TokenKind.INDEX_ALL:
		return {
			kind: CompiledConstraintDataKind.INDEX,
			arrAllowed: true,
			objAllowed: true,
			siblingIndex: parseInt(tokenString),
		};
	case lexer.TokenKind.INDEX_OBJECT:
		return {
			kind: CompiledConstraintDataKind.INDEX,
			arrAllowed: false,
			objAllowed: true,
			// must strip surrounding '{}[]' characters
			siblingIndex: parseInt(tokenString.slice(1, -1)),
		};
	case lexer.TokenKind.INDEX_ARRAY:
		return {
			kind: CompiledConstraintDataKind.INDEX,
			arrAllowed: true,
			objAllowed: false,
			// must strip surrounding '{}[]' characters
			siblingIndex: parseInt(tokenString.slice(1, -1)),
		};

	// cases below are key constraints
	case lexer.TokenKind.KEY_QUOTED:
		return {
			kind: CompiledConstraintDataKind.KEY,
			pattern: tokenString,
		};
	case lexer.TokenKind.KEY_NAKED:
		return {
			kind: CompiledConstraintDataKind.KEY,
			pattern: '"' + tokenString + '"',
		};
	// cases below are non-trivial value constraints
	case lexer.TokenKind.VALUE_EXACT_STRING:
		return {
			kind: CompiledConstraintDataKind.VALUE_STRING,
			// must strip the # value prefix from the token
			pattern: tokenString.slice(1),
		};
	case lexer.TokenKind.VALUE_EXACT_NUMBER:
		return {
			kind: CompiledConstraintDataKind.VALUE_NUMBER,
			// must strip the # value prefix from the token
			pattern: tokenString.slice(1),
		};
	}
}


function trivialPropertiesFalseInit(): Writable<TrivialValueProperties> {
	return {
		allowArr:     false,
		allowObj:     false,
		allowNull:    false,
		allowTrue:    false,
		allowFalse:   false,
		allowString:  false,
		allowNumber:  false,
	};
}

function trivialPropertiesTrueInit(): Writable<TrivialValueProperties> {
	return {
		allowArr:     true,
		allowObj:     true,
		allowNull:    true,
		allowTrue:    true,
		allowFalse:   true,
		allowString:  true,
		allowNumber:  true,
	};
}
