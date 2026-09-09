import * as lexer from "./../lex/lexer_a_index.ts"
import * as parser from "./../parse/parser_a_index.ts"
import {
	type MutableParseTape,
} from "./compiler_preprocess.ts"
import {
	PropertyStatus,
	type CompiledConstraintProperties,
	type CompiledConstraint,
	type CompiledConstraintNode,
	CompiledConstraintNodeKind,
} from "./compiler_types.ts"


export function compileConstraints(
	parseTape: MutableParseTape, tokenTape: lexer.TokenTape
): Readonly<Array<CompiledConstraint>>{
	
	const constraints: Array<CompiledConstraint> = [];
	for(let i = 0; i < parseTape.pairCount; i++){
		constraints.push(
			compileSingleConstraint(parseTape.constraints[i], tokenTape)!,
		);
	}
	
	// todo go around through parse tape left right and modify
	// properties accordingly
	
	return Object.freeze(constraints);
}

/**
	By performing a Kahn's algorithm compiles 
	constraint tree into compiled constraint array.

*/
function compileSingleConstraint(
	root: parser.ConstraintTreeNode,
	tokenTape: lexer.TokenTape,
): CompiledConstraint {
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
	whereas parent[i] holds indexe of node i's parent in the node array.
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
	creates an incoming edges array based on node parents mapping array
	incoming edges is "how many children this node has".
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

function compileConstraintNode(
	targetNodeIdx: number,
	parent: number,
	children: Readonly<Array<number>>,
	inputNodes: Readonly<Array<parser.ConstraintTreeNode>>,
	outputNodes: Readonly<Array<CompiledConstraintNode>>,
	tokenTape: lexer.TokenTape,
): CompiledConstraintNode {
	const node = inputNodes[targetNodeIdx];

	let properties = {} as CompiledConstraintProperties;
	let newKind = -1 as CompiledConstraintNodeKind;

	let siblingIndex: number | undefined = undefined;
	let stringPattern: string | undefined = undefined;


	switch(node.kind){
	case parser.ConstraintTreeNodeKind.ATOM:
		[properties, newKind, siblingIndex, stringPattern] = compileNodeAtom(
			tokenTape.tokenKind[node.tokenIdx],
			tokenTape.tokenString[node.tokenIdx],
		);
		break;
	case parser.ConstraintTreeNodeKind.NOT:
		[properties, newKind] = compileNodeNot(

		); 
		break;
	case parser.ConstraintTreeNodeKind.AND:
		[properties, newKind] = compileNodeAnd(

		); 
		break;
	case parser.ConstraintTreeNodeKind.OR:
		[properties, newKind] = compileNodeOr(

		); 
		break;
	case parser.ConstraintTreeNodeKind.IMPLICIT:
		[properties, newKind] = compileNodeImplicit(); 
		break;
	default:
		node satisfies never;
	}
	
	return {
		kind: newKind,
		parent: parent,
		children: children,

		properties: properties,
		siblingIndex: siblingIndex,
		stringPattern: stringPattern,
	};
	
}

function compileNodeOr(): [CompiledConstraintProperties, CompiledConstraintNodeKind] {
	//@ts-expect-error
	return 0;
}
function compileNodeAnd(): [CompiledConstraintProperties, CompiledConstraintNodeKind] {
	//@ts-expect-error
	return 0;
}
function compileNodeNot(): [CompiledConstraintProperties, CompiledConstraintNodeKind] {
	//@ts-expect-error
	return 0;
}
function compileNodeImplicit(): [CompiledConstraintProperties, CompiledConstraintNodeKind] {
	// re-uses the logic from atom constraint function because
	// implicit must be the same as wildcard all for all intents and purposes.
	const properties = atomConstraintProperties(lexer.TokenKind.WILDCARD_ALL);
	return [properties, CompiledConstraintNodeKind.LEAF];
}

function compileNodeAtom(
	tokenKind: lexer.TokenKind,
	tokenString: string,
): [
	CompiledConstraintProperties,
	CompiledConstraintNodeKind,
	number | undefined,
	string | undefined,
] {
	//@ts-expect-error
	return 0;
}


function atomSiblingIndexStringPattern(
	
): [number | undefined, string | undefined] {

	//@ts-expect-error
	return 0;
}

type Writable<T> = { -readonly [Key in keyof T]: T[Key] };


/**
	Assembles as compiled constraint properties object
	based on a token kind of ATOM tree node.
*/
function atomConstraintProperties(
	tokenKind: lexer.TokenKind
): CompiledConstraintProperties {
	let props = {} as Writable<CompiledConstraintProperties>;
	// aliases for less noise.
	const PS = PropertyStatus;
	const TK = lexer.TokenKind;

	switch (tokenKind){	
		default:
			throw new Error("Fatal compiler error, unexpected enum variant.");
		case TK.WILDCARD_ALL:
		case TK.INDEX_ALL:
			props = constraintPropertiesMaybeInit();
			props.wildcard = PS.MUST;
			return props;
		case TK.KEY_QUOTED:
		case TK.KEY_NAKED:
		case TK.INDEX_OBJECT:
		case TK.WILDCARD_OBJECT:
			props = constraintPropertiesMaybeInit();
			props.contextArr = PS.MUST_NOT;
			props.contextObj = PS.MUST;
			return props;
		case TK.INDEX_ARRAY:
		case TK.WILDCARD_ARRAY:
			props = constraintPropertiesMaybeInit();
			props.contextArr = PS.MUST;
			props.contextObj = PS.MUST_NOT;
			return props;
		// value type wildcard allows all primitives but not array or object as value
		case TK.VALUE_TYPE_WILDCARD:
			props = constraintPropertiesMaybeInit();
			props.valueArr = PS.MUST_NOT;
			props.valueObj = PS.MUST_NOT;
			return props;
		case TK.VALUE_EXACT_STRING:
		case TK.VALUE_TYPE_STRING:
			props = constraintPropertiesNotValueInit();
			props.valueString = PS.MUST;
			return props;
		case TK.VALUE_TYPE_NUMBER:
		case TK.VALUE_EXACT_NUMBER:
			props = constraintPropertiesNotValueInit();
			props.valueNumber = PS.MUST;
			return props;
		case TK.VALUE_TYPE_ARRAY:
			props = constraintPropertiesNotValueInit();
			props.valueArr = PS.MUST;
			return props;
		case TK.VALUE_TYPE_OBJECT:
			props = constraintPropertiesNotValueInit();
			props.valueObj = PS.MUST;
			return props;
		case TK.VALUE_EXACT_NULL:
			props = constraintPropertiesNotValueInit();
			props.valueNull = PS.MUST;
			return props;
		case TK.VALUE_EXACT_TRUE:
			props = constraintPropertiesNotValueInit();
			props.valueTrue = PS.MUST;
			return props;
		case TK.VALUE_EXACT_FALSE:
			props = constraintPropertiesNotValueInit();
			props.valueFalse = PS.MUST;
			return props;
		case TK.VALUE_TYPE_BOOLEAN:
			props = constraintPropertiesNotValueInit();
			props.valueFalse = PS.MAYBE;
			props.valueTrue = PS.MAYBE;
			return props;
	}
}


/**
	Creates a mutable constraint properties object
	filled with MUST_NOT value in all its fields regarding
	the value content.

	Wildcard and context fields must be filled with MAYBE instead.
*/
function constraintPropertiesNotValueInit(): Writable<CompiledConstraintProperties> {
	return {
		wildcard:     PropertyStatus.MAYBE,

		contextArr:   PropertyStatus.MAYBE,
		contextObj:   PropertyStatus.MAYBE,

		valueArr:     PropertyStatus.MUST_NOT,
		valueObj:     PropertyStatus.MUST_NOT,
		valueNull:    PropertyStatus.MUST_NOT,
		valueTrue:    PropertyStatus.MUST_NOT,
		valueFalse:   PropertyStatus.MUST_NOT,
		valueString:  PropertyStatus.MUST_NOT,
		valueNumber:  PropertyStatus.MUST_NOT,
	};
}
/**
	Creates a mutable constraint properties object
	filled with MAYBE value in all its fields.
*/
function constraintPropertiesMaybeInit(): Writable<CompiledConstraintProperties> {
	return {
		wildcard:     PropertyStatus.MAYBE,

		contextArr:   PropertyStatus.MAYBE,
		contextObj:   PropertyStatus.MAYBE,
		valueArr:     PropertyStatus.MAYBE,
		valueObj:     PropertyStatus.MAYBE,
		valueNull:    PropertyStatus.MAYBE,
		valueTrue:    PropertyStatus.MAYBE,
		valueFalse:   PropertyStatus.MAYBE,
		valueString:  PropertyStatus.MAYBE,
		valueNumber:  PropertyStatus.MAYBE,
	};
}