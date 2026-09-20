import * as lexer from "./../lex/lexer_a_index.ts"
import * as parser from "./../parse/parser_a_index.ts"

import { preprocessHoistConstraints } from "./compiler_preprocess.ts"
import {compileConstraints} from "./compiler_core.ts"
import {calculateExpressionDepths} from "./compiler_depths.ts"
export type CompiledExpression = undefined;

/**
	TODO: DOCSTRING
*/
export function compileExpression(
	parseTape: parser.ExpressionParseTape,
	tokenTape: lexer.TokenTape,
): CompiledExpression {

	const hoistedConstraints = preprocessHoistConstraints(
		parseTape.combinators, parseTape.constraints
	);

	const compiledConstraints = compileConstraints(hoistedConstraints, tokenTape);

	const tree = parser.ExpressionParseTapeUtils.Display.asTree(
		{pairCount: parseTape.pairCount,
		constraints: hoistedConstraints,
		combinators: parseTape.combinators}, tokenTape,
	);
	console.log(tree);
	console.log(compiledConstraints);
	const depths = calculateExpressionDepths(parseTape.combinators);
	console.log(depths);
	return undefined;

}