import * as lexer from "./../lex/lexer_a_index.ts"
import * as parser from "./../parse/parser_a_index.ts"

import {
	type MutableParseTape,
	mutableParseTapeCopy,
	preprocessHoistConstraints,
} from "./compiler_preprocess.ts"
import {compileConstraints} from "./compiler_core.ts"

export type CompiledExpression = undefined;

/**
	TODO: DOCSTRING
*/
export function compileExpression(
	parseTape: parser.ExpressionParseTape,
	tokenTape: lexer.TokenTape,
): CompiledExpression {
	const mutParseTape: MutableParseTape = mutableParseTapeCopy(parseTape);
	preprocessHoistConstraints(mutParseTape);

	const temp = compileConstraints(mutParseTape, tokenTape);

	const tree = parser.ExpressionParseTapeUtils.Display.asTree(
		mutParseTape as parser.ExpressionParseTape, tokenTape,
	);
	console.log(tree);

	return undefined;

}