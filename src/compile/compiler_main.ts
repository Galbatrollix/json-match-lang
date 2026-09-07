import * as lexer from "./../lex/lexer_a_index.ts"
import * as parser from "./../parse/parser_a_index.ts"

import {
	mutableParseTapeCopy,
	preprocessInPlace,
} from "./compiler_preprocess.ts"

export type CompiledExpression = undefined;

/**
	TODO: DOCSTRING
*/
export function compileExpression(
	parseTape: parser.ExpressionParseTape,
	tokenTape: lexer.TokenTape,
): CompiledExpression {
	const mutParseTape = mutableParseTapeCopy(parseTape);
	preprocessInPlace(mutParseTape);


	const tree = parser.ExpressionParseTapeUtils.Display.asTree(
		mutParseTape as parser.ExpressionParseTape, tokenTape,
	);
	console.log(tree);

	return undefined;

}