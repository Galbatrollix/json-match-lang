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

	constraintPropertiesKeysMain,
	constraintPropertiesKeysAll,
	constraintPropertiesKeysValue,
	constraintPropertiesKeysContext,
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

	console.log(root);
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
			poppedNodeIdx,
			parents[poppedNodeIdx],
			children[poppedNodeIdx],
			nodes,
			compiledConstraints,
			tokenTape,
		);
		compiledConstraints[poppedNodeIdx] = compiled;

		console.log(compiled.properties);

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
			outputNodes[children[0]].properties,
		); 
		break;
	case parser.ConstraintTreeNodeKind.AND:
		[properties, newKind] = compileNodeAnd(
			children, outputNodes,
		); 
		break;
	case parser.ConstraintTreeNodeKind.OR:
		[properties, newKind] = compileNodeOr(
			children, outputNodes,
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

type Writable<T> = { -readonly [Key in keyof T]: T[Key] };

function compileNodeOr(
	children: Readonly<Array<number>>,
	outputNodes: Readonly<Array<CompiledConstraintNode>>,
): [CompiledConstraintProperties, CompiledConstraintNodeKind] {
	const kind = CompiledConstraintNodeKind.OR;

	const {nevers, wildcards, trivials} = childrenPropertiesStats(
		children, outputNodes,
	);
	// if at least one wildcard found, entire OR is wildcard too
	// if all children are nevers, then entire OR is never too.
	if (wildcards){
		return [constraintPropertiesWildcardInit(), kind];
	}else if (nevers == children.length){
		return [constraintPropertiesNeverInit(), kind];
	}


	const properties = constraintPropertiesWritableCopy(
		outputNodes[children[0]].properties,
	);
	for (const key of constraintPropertiesKeysMain){
		let prop = properties[key];
		for (let i = 1; i < children.length; i++){
			const childIdx = children[i];
			const childProp = outputNodes[childIdx].properties[key];
			prop = propertyResolutionOr[prop][childProp];
		}

		properties[key] = prop;
	}
	
	
	properties.wildcard = PropertyStatus.UNDEFINED;
	properties.trivial = trivials == children.length;
	
	// if result can match everything, return wildcard instead
	if (propertiesWildcardTransformable(properties)){
		return [constraintPropertiesWildcardInit(), kind];
	}

	return [properties, kind];
}


function compileNodeAnd(
	children: Readonly<Array<number>>,
	outputNodes: Readonly<Array<CompiledConstraintNode>>,
): [CompiledConstraintProperties, CompiledConstraintNodeKind] {
	const kind = CompiledConstraintNodeKind.AND;

	const {nevers, wildcards, trivials} = childrenPropertiesStats(
		children, outputNodes,
	);
	// if at least one never found, entire AND is never too
	// if all children are wildcards, then entire AND is wildcard too.
	if (nevers){
		return [constraintPropertiesNeverInit(), kind];
	}else if (wildcards == children.length){
		return [constraintPropertiesWildcardInit(), kind];
	}


	const properties = constraintPropertiesWritableCopy(
		outputNodes[children[0]].properties,
	);
	for (const key of constraintPropertiesKeysMain){
		let prop = properties[key];
		for (let i = 1; i < children.length; i++){
			const childIdx = children[i];
			const childProp = outputNodes[childIdx].properties[key];
			prop = propertyResolutionAnd[prop][childProp];
		}

		properties[key] = prop;
	}
	
	
	properties.wildcard = PropertyStatus.UNDEFINED;
	properties.trivial = trivials == children.length;
	
	// if result cannot match anything, return nerver instead
	if (propertiesNeverTransformable(properties)){
		return [constraintPropertiesNeverInit(), kind];
	}

	return [properties, kind];
}


/**
	Table for resolving AND
*/
const propertyResolutionAnd = {
	[PropertyStatus.UNDEFINED] : {
		[PropertyStatus.UNDEFINED]: PropertyStatus.UNDEFINED,
		[PropertyStatus.MAY_PASS]: PropertyStatus.MAY_PASS,
		[PropertyStatus.CANNOT_PASS]: PropertyStatus.CANNOT_PASS,
	},
	[PropertyStatus.MAY_PASS] : {
		[PropertyStatus.UNDEFINED]: PropertyStatus.MAY_PASS,
		[PropertyStatus.MAY_PASS]: PropertyStatus.MAY_PASS,
		[PropertyStatus.CANNOT_PASS]: PropertyStatus.CANNOT_PASS,
	},
	[PropertyStatus.CANNOT_PASS] : {
		[PropertyStatus.UNDEFINED]: PropertyStatus.CANNOT_PASS,
		[PropertyStatus.MAY_PASS]: PropertyStatus.CANNOT_PASS,
		[PropertyStatus.CANNOT_PASS]: PropertyStatus.CANNOT_PASS,
	},
} as const;


/**
	Table for resolving OR
*/
const propertyResolutionOr = {
	[PropertyStatus.UNDEFINED] : {
		[PropertyStatus.UNDEFINED]: PropertyStatus.UNDEFINED,
		[PropertyStatus.MAY_PASS]: PropertyStatus.MAY_PASS,
		[PropertyStatus.CANNOT_PASS]: PropertyStatus.CANNOT_PASS,
	},
	[PropertyStatus.MAY_PASS] : {
		[PropertyStatus.UNDEFINED]: PropertyStatus.MAY_PASS,
		[PropertyStatus.MAY_PASS]: PropertyStatus.MAY_PASS,
		[PropertyStatus.CANNOT_PASS]: PropertyStatus.MAY_PASS,
	},
	[PropertyStatus.CANNOT_PASS] : {
		[PropertyStatus.UNDEFINED]: PropertyStatus.CANNOT_PASS,
		[PropertyStatus.MAY_PASS]: PropertyStatus.MAY_PASS,
		[PropertyStatus.CANNOT_PASS]: PropertyStatus.CANNOT_PASS,
	},
} as const;

function compileNodeNot(
	childProps: CompiledConstraintProperties
): [CompiledConstraintProperties, CompiledConstraintNodeKind] {
	const kind = CompiledConstraintNodeKind.LEAF;
	
	// special cases for wildcards and nevers 
	switch (childProps.wildcard){
	case PropertyStatus.MAY_PASS:
		return [constraintPropertiesNeverInit(), kind];
	case PropertyStatus.CANNOT_PASS:
		return [constraintPropertiesWildcardInit(), kind];
	default:
	}

	// normal path
	const properties = {} as Writable<CompiledConstraintProperties>;
	properties.trivial = childProps.trivial;
	properties.wildcard = PropertyStatus.UNDEFINED;
	
	for (const k of constraintPropertiesKeysMain){
		switch(childProps[k]){
		case PropertyStatus.UNDEFINED:
			properties[k] = childProps[k];
			break;
		case PropertyStatus.MAY_PASS:
			properties[k] = PropertyStatus.CANNOT_PASS;
			break;
		case PropertyStatus.CANNOT_PASS:
			properties[k] = PropertyStatus.MAY_PASS;
			break;
		default:
			childProps[k] satisfies never;
		}
	}

	return [properties, kind];
}
function compileNodeImplicit(): [CompiledConstraintProperties, CompiledConstraintNodeKind] {
	// implicit must be the same as wildcard all for all intents and purposes.
	const properties = constraintPropertiesWildcardInit();
	return [properties, CompiledConstraintNodeKind.LEAF];
}

function compileNodeAtom(tokenKind: lexer.TokenKind, tokenString: string)
: [
	CompiledConstraintProperties,
	CompiledConstraintNodeKind,
	number | undefined,
	string | undefined,
] {

	const properties = atomConstraintProperties(tokenKind);
	const [siblingIndex, stringPattern] = atomSiblingIndexStringPattern(
		tokenKind, tokenString,
	);

	return [
		properties,
		CompiledConstraintNodeKind.LEAF,
		siblingIndex,
		stringPattern,
	];
}


function atomSiblingIndexStringPattern(
	tokenKind: lexer.TokenKind, tokenString: string,
): [number | undefined, string | undefined] {

	let siblingIndex: number | undefined = undefined;
	let stringPattern: string | undefined = undefined;

	switch(tokenKind){
	case lexer.TokenKind.KEY_NAKED: 
		// must make proper string pattern with quotes out of naked token
		stringPattern = '"' + tokenString + '"';
		break;
	case lexer.TokenKind.KEY_QUOTED:
		stringPattern = tokenString;
		break;
	case lexer.TokenKind.VALUE_EXACT_STRING:
	case lexer.TokenKind.VALUE_EXACT_NUMBER:
		// must strip the # value prefix from the token
		stringPattern = tokenString.slice(1);
		break;
	case lexer.TokenKind.INDEX_ALL:
		siblingIndex = parseInt(tokenString);
		break;
	case lexer.TokenKind.INDEX_ARRAY:
	case lexer.TokenKind.INDEX_OBJECT:
		// must strip surrounding '{}[]' characters
		siblingIndex = parseInt(tokenString.slice(1, -1));
		break;
	default:;
	}

	return [siblingIndex, stringPattern];
}


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
	// the one and only wildcard constraint that matches everything
	case TK.WILDCARD_ALL:
		props = constraintPropertiesWildcardInit();
		return props;

	// cases below are trivial 
	case TK.VALUE_TYPE_STRING:
		props = constraintPropertiesInit(PS.UNDEFINED, PS.CANNOT_PASS);
		props.valueString = PS.MAY_PASS;
		return props;
	case TK.VALUE_TYPE_NUMBER:
		props = constraintPropertiesInit(PS.UNDEFINED, PS.CANNOT_PASS);
		props.valueNumber = PS.MAY_PASS;
		return props;
	case TK.VALUE_TYPE_ARRAY:
		props = constraintPropertiesInit(PS.UNDEFINED, PS.CANNOT_PASS);
		props.valueArr = PS.MAY_PASS;
		return props;
	case TK.VALUE_TYPE_OBJECT:
		props = constraintPropertiesInit(PS.UNDEFINED, PS.CANNOT_PASS);
		props.valueObj = PS.MAY_PASS;
		return props;
	case TK.VALUE_EXACT_NULL:
		props = constraintPropertiesInit(PS.UNDEFINED, PS.CANNOT_PASS);
		props.valueNull = PS.MAY_PASS;
		return props;
	case TK.VALUE_EXACT_TRUE:
		props = constraintPropertiesInit(PS.UNDEFINED, PS.CANNOT_PASS);
		props.valueTrue = PS.MAY_PASS;
		return props;
	case TK.VALUE_EXACT_FALSE:
		props = constraintPropertiesInit(PS.UNDEFINED, PS.CANNOT_PASS);
		props.valueFalse = PS.MAY_PASS;
		return props;
	case TK.VALUE_TYPE_BOOLEAN:
		props = constraintPropertiesInit(PS.UNDEFINED, PS.CANNOT_PASS);
		props.valueFalse = PS.MAY_PASS;
		props.valueTrue = PS.MAY_PASS;
		return props;	
	// value type wildcard allows all primitives but not array or object as value
	case TK.VALUE_TYPE_WILDCARD:
		props = constraintPropertiesInit(PS.UNDEFINED, PS.MAY_PASS);
		props.valueArr = PS.CANNOT_PASS;
		props.valueObj = PS.CANNOT_PASS;
		return props;
	case TK.WILDCARD_ARRAY:
		props = constraintPropertiesInit(PS.UNDEFINED, PS.UNDEFINED);
		props.contextArr = PS.MAY_PASS;
		props.contextObj = PS.CANNOT_PASS;
		return props;
	case TK.WILDCARD_OBJECT:
		props = constraintPropertiesInit(PS.UNDEFINED, PS.UNDEFINED);
		props.contextArr = PS.CANNOT_PASS;
		props.contextObj = PS.MAY_PASS;
		return props;

	// cases below are non-trivial
	case TK.INDEX_ALL:
		props = constraintPropertiesInit(PS.UNDEFINED, PS.UNDEFINED);
		props.trivial = false;
		return props;
	case TK.KEY_QUOTED:
	case TK.KEY_NAKED:
	case TK.INDEX_OBJECT:
		props = constraintPropertiesInit(PS.UNDEFINED, PS.UNDEFINED);
		props.contextArr = PS.CANNOT_PASS;
		props.contextObj = PS.MAY_PASS;
		props.trivial = false;
		return props;
	case TK.INDEX_ARRAY:
		props = constraintPropertiesInit(PS.UNDEFINED, PS.UNDEFINED);
		props.contextArr = PS.MAY_PASS;
		props.contextObj = PS.CANNOT_PASS;
		props.trivial = false;
		return props;
	case TK.VALUE_EXACT_STRING:
		props = constraintPropertiesInit(PS.UNDEFINED, PS.CANNOT_PASS);
		props.valueString = PS.MAY_PASS;
		props.trivial = false;
		return props;
	case TK.VALUE_EXACT_NUMBER:
		props = constraintPropertiesInit(PS.UNDEFINED, PS.CANNOT_PASS);
		props.valueNumber = PS.MAY_PASS;
		props.trivial = false;
		return props;
	}
}



/**
	Creates a mutable constraint properties object.
	
	Value flags are set to value given in "valueVal" parameter
	Context flags are set to value given in "contextVal" parameter

	"wildcard" flag is always set to UNDEFINED
	"trivial" flag is always set to true
*/
function constraintPropertiesInit(
	contextVal: PropertyStatus, valueVal: PropertyStatus,
): Writable<CompiledConstraintProperties> {
	return {
		trivial:     true,
		wildcard:    PropertyStatus.UNDEFINED,

		contextArr:  contextVal,
		contextObj:  contextVal,

		valueArr:    valueVal,
		valueObj:    valueVal,
		valueNull:   valueVal,
		valueTrue:   valueVal,
		valueFalse:  valueVal,
		valueString: valueVal,
		valueNumber: valueVal,
	};
}

function constraintPropertiesWildcardInit(): Writable<CompiledConstraintProperties> {
	const props = constraintPropertiesInit(
		PropertyStatus.UNDEFINED, PropertyStatus.UNDEFINED,
	);
	props.wildcard = PropertyStatus.MAY_PASS;
	return props;
}

function constraintPropertiesNeverInit(): Writable<CompiledConstraintProperties> {
	const props = constraintPropertiesInit(
		PropertyStatus.UNDEFINED, PropertyStatus.UNDEFINED,
	);
	props.wildcard = PropertyStatus.CANNOT_PASS;
	return props;
}

function constraintPropertiesWritableCopy(
	original: CompiledConstraintProperties,
): Writable<CompiledConstraintProperties> {
	const props = {} as Writable<CompiledConstraintProperties>;

	for (const k of constraintPropertiesKeysAll){
		// typescript cannot for its life figure out that this loop is valid
		// this is simply embarassing and plain wrong

		// @ts-ignore
		props[k] = original[k];
	}
	return props;
}


function childrenPropertiesStats(
	children: Readonly<Array<number>>,
	outputNodes: Readonly<Array<CompiledConstraintNode>>,
): {nevers: number, wildcards: number, trivials: number} {

	let nevers = 0, wildcards = 0;
	let trivials =  0;
	for (const childIdx of children){
		const props = outputNodes[childIdx].properties;
		switch (props.wildcard){
		case PropertyStatus.MAY_PASS:
			wildcards += 1;
			break;
		case PropertyStatus.CANNOT_PASS:
			nevers += 1;
			break;
		default:
		}

		if (props.trivial){
			trivials += 1;
		}
	}

	return {nevers, wildcards, trivials};
}
/**
	Returns true if given props object can be safely transformed 
	into never properties object.
*/
function propertiesNeverTransformable(props: CompiledConstraintProperties): boolean {
	if (props.wildcard == PropertyStatus.CANNOT_PASS){
		return true;
	}

	const groups = [
		constraintPropertiesKeysContext,
		constraintPropertiesKeysValue,
	];
	
	for (const group of groups){
		let negativeConstraints = 0;	
		for (const k of group){
			if (props[k] == PropertyStatus.CANNOT_PASS){
				negativeConstraints += 1;
			}
		}
		// if all constraints in a group are negative, then nothing can match
		// regardless if constraints were trivial or not
		if (negativeConstraints == group.length){
			return true;
		}
	}
	
	return false;
}


/**
	Returns true if given props object can be safely transformed 
	into wildcard properties object.
*/
function propertiesWildcardTransformable(props: CompiledConstraintProperties): boolean {
	if (props.wildcard == PropertyStatus.MAY_PASS){
		return true;
	}
		
	// non trivial constraints cannot be safely converted to wildcard
	if (! props.trivial){
		return false;
	}
	
	let negativeConstraints = 0;
	for (const k of constraintPropertiesKeysMain){
		if (props[k] == PropertyStatus.CANNOT_PASS){
			negativeConstraints += 1;
		}
	}

	return negativeConstraints == 0;
	
}