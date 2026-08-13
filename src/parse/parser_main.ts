import * as lexer from "./../lex/lexer_main.ts"
import {type ParseError} from "./parser_errors.ts"
import {type ParseWarning} from "./parser_warnings.ts"
import {
	preprocessFindInvalidTokens,
	preprocessFindBogusPairs,
	preprocessFilterWhitespace,
} from "./parser_preprocess.ts"
import {generateExpressionParseTape} from "./parser_impl.ts"


export type CompiledExpression = undefined;

export type ParseResult = Readonly<{
	output: CompiledExpression,
	errors: Readonly<Array<ParseError>>,
	warnings: Readonly<Array<ParseWarning>>,
}>;



//todo: go over lexer and maybe reorganize it so it makes more sense, update docstrings and
// names perhaps too

export function parseExpressionTokens(tape: lexer.TokenTape): ParseResult {
	
	// find any critical and easy to spot errors with supplied token tape
	const preprocessingErrors: Array<ParseError> = preprocessFindInvalidTokens(tape);
	if (preprocessingErrors.length){
		return assembleParseResult(
			emptyCompiledExpression(), preprocessingErrors, [] 
		);
	}
	const warnings: Array<ParseWarning> = preprocessFindBogusPairs(tape);
	const errors: Array<ParseError> = [];

	const filterResult = preprocessFilterWhitespace(tape);

	const filteredTokens: Array<lexer.TokenKind> = filterResult.tokens;
	const originalIndexMapping: Array<number> = filterResult.mapping;

	const _temp = generateExpressionParseTape(filteredTokens);

	console.log(_temp, _temp.parseTape.constraints);
	// todo: postprocess errors to transform the filtered token indexes 
	// into original token indexes
	
	return assembleParseResult(emptyCompiledExpression(), errors, warnings);
}


function emptyCompiledExpression(): CompiledExpression {
	return undefined;
}

/**
	Turns parse result parts and assembles them into final 
	object and performs necessary freezing operations.

	Arrays given as parameters may be modified (frozen)
*/
function assembleParseResult(
	output: CompiledExpression,
	errors: Array<ParseError>,
	warnings: Array<ParseWarning>,
): ParseResult{
	return {
		output: output,
		errors: Object.freeze(errors),
		warnings: Object.freeze(warnings),
	}
}