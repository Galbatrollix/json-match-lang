import * as compiler from "./../compile/compiler_a_index.ts"
import * as json from "./../json/json_a_index.ts"

//todo docstrings in this file
export function nodePassesConstraints(
	expr: compiler.CompiledExpression,
	exprIdx: number,
	ast: json.JsonSyntaxTree,
	astIdx: number,
): boolean {
	const depthsOk: boolean = depthPrecheckPasses(
		expr.minDepths[exprIdx],
		expr.childDepths[exprIdx],
		ast.nodeDepth[astIdx],
		ast.childDepth[astIdx],
	);
	if (! depthsOk) return false;

	return completeCheckPasses(
		expr.constraints[exprIdx], ast, astIdx,
	);
}

// todo: get this working once everything else is in order.
// should be simple inaf
function depthPrecheckPasses(
	minNodeDepth: number,
	minChildDepth: number,
	nodeDepth: number,
	childDepth: number,
): boolean {
	
	return true;
}


function completeCheckPasses(
	constraint: compiler.CompiledConstraint,
	ast: json.JsonSyntaxTree,
	astIdx: number,
): boolean {
	
	// "resolved" could be a dedicated bitset structure but lets leave it for now
	// note: leaf nodes do not care about being resolved,
	// AND and NOT are resolved on fail, OR gets resolved on passing
	const resolved = new Uint8Array(constraint.length);

	// we take advantage of the fact that compiled constraint array of nodes
	// is topolgically sorted - all children go after their parents in the tree.
	// hence the reverse order iteration to visit children before their parents
	for(let node = constraint.length - 1; node >= 1; node--){
		const parent = constraint[node].parent;
		const data = constraint[node].data;

		// if nodes parent is already resolved, the result of current node is inconsequential.
		if(resolved[parent]){
			continue;
		}

		const passes: boolean = constraintNodePasses(
			data, !!resolved[node], ast, astIdx,
		);
		
		// resolve parent based on whether current node passed
		resolved[parent] = + parentResolveValue(
			constraint[parent].data.kind, passes,
		);

	}
	
	// resolution of constraint root (0) determines final result at the end
	return constraintNodePasses(
		constraint[0].data, !!resolved[0], ast, astIdx,
	);
}

/**
	Based on whether a child node passes and what type of node is a parent node,
	decides whether parent node resolved status should be assigned true (1) or false (0)
*/
function parentResolveValue(
	parentKind: compiler.CompiledConstraintDataKind,
	childPasses: boolean,
): boolean {
	switch (parentKind){
	case compiler.CompiledConstraintDataKind.AND:
	case compiler.CompiledConstraintDataKind.NOT:
		return !childPasses;
	case compiler.CompiledConstraintDataKind.OR:
		return childPasses;
	default:
		throw new Error("Fatal interal error while matching." +
		" Leaf node found when processing a parent of another node.");
	}
}

function constraintNodePasses(
	nodeData: compiler.CompiledConstraintData,
	nodeResolved: boolean,
	ast: json.JsonSyntaxTree,
	astIdx: number,
): boolean {
	switch (nodeData.kind){
	case compiler.CompiledConstraintDataKind.WILDCARD:
		return true;
	case compiler.CompiledConstraintDataKind.OR:
		return nodeResolved;
	case compiler.CompiledConstraintDataKind.AND:
	case compiler.CompiledConstraintDataKind.NOT:
		return !nodeResolved;
	case compiler.CompiledConstraintDataKind.INDEX:
		return indexConstraintPasses(
			ast, astIdx, nodeData.siblingIndex, nodeData.arrAllowed, nodeData.objAllowed,
		);
	case compiler.CompiledConstraintDataKind.VALUE_STRING:
		return stringConstraintPasses(ast, astIdx, nodeData.pattern);
	case compiler.CompiledConstraintDataKind.KEY:
		return keyConstraintPasses(ast, astIdx, nodeData.pattern);
	case compiler.CompiledConstraintDataKind.VALUE_NUMBER:
		return numberConstraintPasses(ast, astIdx, nodeData.pattern);
	case compiler.CompiledConstraintDataKind.VALUE_TRIVIAL:
		return trivialConstraintPasses(ast, astIdx, nodeData.properties);
	}
}


function trivialConstraintPasses(
	ast: json.JsonSyntaxTree,
	astIdx: number,
	properties: compiler.TrivialValueProperties,
): boolean {
	switch (ast.valueKind[astIdx]){
	case json.JsonValueKind.ARRAY:
		return properties.allowArr;
	case json.JsonValueKind.OBJECT:
		return properties.allowObj;
	case json.JsonValueKind.NULL:
		return properties.allowNull;
	case json.JsonValueKind.TRUE:
		return properties.allowTrue;
	case json.JsonValueKind.FALSE:
		return properties.allowFalse;
	case json.JsonValueKind.STRING:
		return properties.allowString;
	case json.JsonValueKind.NUMBER:
		return properties.allowNumber;
	default:
		throw new Error("Fatal interal error, wrong json value enum.");
	}
}

function stringConstraintPasses(
	ast: json.JsonSyntaxTree,
	astIdx: number,
	expectedStringValue: string,
): boolean {
	if (ast.valueKind[astIdx] != json.JsonValueKind.STRING){
		return false;
	}

	const nodeString = ast.strings[ast.stringRefValue[astIdx]];
	return `"` + nodeString + `"` == expectedStringValue;
}

function numberConstraintPasses(
	ast: json.JsonSyntaxTree,
	astIdx: number,
	expectedNumberValue: string,
): boolean {
	if (ast.valueKind[astIdx] != json.JsonValueKind.NUMBER){
		return false;
	}
	const nodeString = ast.strings[ast.stringRefValue[astIdx]];
	return nodeString == expectedNumberValue;
}

function keyConstraintPasses(
	ast: json.JsonSyntaxTree,
	astIdx: number,
	expectedKeyValue: string,
): boolean {
	const parentIdx = ast.parent[astIdx];
	if (ast.valueKind[parentIdx] != json.JsonValueKind.OBJECT){
		return false;
	}

	const keyString = ast.strings[ast.stringRefKey[astIdx]];
	return `"` + keyString + `"` == expectedKeyValue;
}

function indexConstraintPasses(
	ast: json.JsonSyntaxTree,
	astIdx: number,
	expectedSiblingIndex: number | undefined,
	arrAllowed: boolean,
	objAllowed: boolean,
): boolean {
	const parentIdx = ast.parent[astIdx];

	let siblingIndex: number;
	let contextIsArray: boolean;

	//todo test and delete this if guard, it should evaluate right anyway
	if (! parentIdx){ // root element is always a 1-element array, therefore:
		siblingIndex = 0;
		contextIsArray = true;
	}else{            // non root element's properties can be derived from its parent
		siblingIndex = astIdx - ast.childFirst[parentIdx];
		contextIsArray = ast.valueKind[parentIdx] == json.JsonValueKind.ARRAY;
	}

	const contextPasses: boolean = (
		contextIsArray && arrAllowed || !contextIsArray && objAllowed
	);

	const indexPasses: boolean = (
		expectedSiblingIndex === undefined
		||
		expectedSiblingIndex == siblingIndex
	);

	return contextPasses && indexPasses;
}
