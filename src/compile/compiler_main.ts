import * as lexer from "./../lex/lexer_a_index.ts"
import * as parser from "./../parse/parser_a_index.ts"

import {preprocessHoistConstraints} from "./compiler_preprocess.ts"
import {compileConstraints} from "./compiler_core.ts"
import {
	calculateMinimalExpressionDepths,
	calculateExpressionChildDepths,
} from "./compiler_depths.ts"

import {getExpressionHoistGroups} from "./compiler_groups.ts"
import {
	type CompiledExpression,
	type CompiledConstraint,
	type CompiledConstraintNode,
	CompiledConstraintDataKind,
} from "./compiler_types.ts"

/**
	TODO: DOCSTRING
*/
export function compileExpression(
	parseTape: parser.ExpressionParseTape,
	tokenTape: lexer.TokenTape,
): CompiledExpression {
	const hoistGroups: Array<Array<number>> = getExpressionHoistGroups(parseTape.combinators);

	const minDepths = calculateMinimalExpressionDepths(parseTape.combinators);
	if (minDepths === undefined){
		return emptyCompiledExpression();
	}
	const childDepths = calculateExpressionChildDepths(parseTape.combinators);
	console.log(minDepths);
	console.log(childDepths);

	const hoistedConstraints = preprocessHoistConstraints(
		parseTape.constraints, hoistGroups,
	);

	const compiledConstraints = compileConstraints(hoistedConstraints, tokenTape);

	const tree = parser.ExpressionParseTapeUtils.Display.asTree(
		{pairCount: parseTape.pairCount,
		constraints: hoistedConstraints,
		combinators: parseTape.combinators}, tokenTape,
	);
	console.log(tree);
	console.log(compiledConstraints);

	return assembleCompiledExpression(
		parseTape.combinators,
		compiledConstraints,
		minDepths,
		childDepths,
	);

}


function emptyCompiledExpression(): CompiledExpression {
	return Object.freeze({
		size: 0,
		combinators: Object.freeze([]),
		constraints: Object.freeze([]),
		minDepths:   Object.freeze([]),
		childDepths: Object.freeze([]),
	});
}

function assembleCompiledExpression(
	combinators: Readonly<Array<parser.ExpressionCombinator>>,
	constraints: Array<CompiledConstraint>,
	minDepths:   Array<number>,
	childDepths: Array<number>,
): CompiledExpression {
	return Object.freeze({
		size:        combinators.length,
		combinators: combinators,
		constraints: deepFreezeConstraints(constraints),
		minDepths:   Object.freeze(minDepths),
		childDepths: Object.freeze(childDepths),
	});
}

function deepFreezeConstraints(
	constraints: Array<CompiledConstraint>
): Readonly<Array<CompiledConstraint>> {
	for (let i = 0; i < constraints.length; i++){
		for (let j = 0; j < constraints[i].length; j++){
			freezeCompiledConstraintNode(constraints[i][j]);
		}
		Object.freeze(constraints[i]);
	}
	return Object.freeze(constraints);
}

function freezeCompiledConstraintNode(node: CompiledConstraintNode): void {
	Object.freeze(node);
	Object.freeze(node.children);
	Object.freeze(node.data);
	if (node.data.kind == CompiledConstraintDataKind.VALUE_TRIVIAL){
		Object.freeze(node.data.properties);
	}
}