import * as lexer from "./../lex/lexer_main.ts"
import {type ParseError} from "./parser_errors.ts"
import {type ParseWarning} from "./parser_warnings.ts"
import {preprocessFindInvalidTokens} from "./parser_preprocess.ts"


export type ExpressionAst = undefined;


export type ParseResult = {
	ast: ExpressionAst,
	warnings: Array<ParseWarning>,
	errors: Array<ParseError>,
};

export function parseExpressionTokens(tape: lexer.TokenTape): ParseResult {
	preprocessFindInvalidTokens(tape);

	return {
		ast: undefined,
		warnings: [],
		errors: [],	
	}
}
