import * as lexer from "./../lex/lexer_a_index.ts"
import * as parser from "./../parse/parser_a_index.ts"

import { preprocessHoistConstraints } from "./compiler_preprocess.ts"
import {compileConstraints} from "./compiler_core.ts"

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

	const temp = compileConstraints(hoistedConstraints, tokenTape);

	const tree = parser.ExpressionParseTapeUtils.Display.asTree(
		{pairCount: parseTape.pairCount,
		constraints: hoistedConstraints,
		combinators: parseTape.combinators}, tokenTape,
	);
	console.log(tree);

	return undefined;

}