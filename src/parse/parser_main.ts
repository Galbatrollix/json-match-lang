import * as lexer from "./../lex/lexer_main.ts"
import {
	type ParseError,
	type IncompleteParseError,
	parseErrorsFromIncomplete,
} from "./parser_errors.ts"
import {
	preprocessFindInvalidTokens,
	preprocessFilterWhitespace,
} from "./parser_preprocess.ts"
import {generateExpressionParseTape} from "./parser_impl.ts"
import {
	type ExpressionParseTape, 
	ExpressionParseTapeUtils,
} from "./parser_types.ts"

import {
	postprocessCollapseTreesInPlace
} from "./parser_postprocess.ts"


export type CompiledExpression = undefined;

export type ParseResult = Readonly<{
	output: CompiledExpression,
	errors: Readonly<Array<ParseError>>,
}>;


//todo: go over lexer and maybe reorganize it so it makes more sense, update docstrings and
// names perhaps too

export function parseExpressionTokens(lexTape: lexer.TokenTape): ParseResult {
	
	// find any critical and easy to spot errors with supplied token lexTape
	const preprocessingErrors: Array<ParseError> = preprocessFindInvalidTokens(lexTape);
	if (preprocessingErrors.length){
		return assembleParseResult(
			emptyCompiledExpression(), preprocessingErrors 
		);
	}

	const filterResult = preprocessFilterWhitespace(lexTape);

	const filteredTokens: Array<lexer.TokenKind> = filterResult.tokens;
	const originalIndexMapping: Array<number> = filterResult.mapping;

	const parseOutput = generateExpressionParseTape(filteredTokens);
	const parseTape: ExpressionParseTape = parseOutput.parseTape;
	const incompleteErrors: Array<IncompleteParseError> = parseOutput.errors;

	const errors: Array<ParseError> = parseErrorsFromIncomplete(
		incompleteErrors,
		originalIndexMapping
	);
	console.log(originalIndexMapping);
	console.log(errors);
	console.log(lexer.TokenTapeUtils.Display.asStr(lexTape));

	if (errors.length){
		return assembleParseResult(
			emptyCompiledExpression(), errors
		);
	};
	// TODO: HERE COLLECT WARNINGS FROM RAW AST

	console.log(ExpressionParseTapeUtils.Display.asTreeFull(
		parseTape,
		lexTape.tokenString,
		originalIndexMapping,
	));
	postprocessCollapseTreesInPlace(parseTape);
	console.log(ExpressionParseTapeUtils.Display.asTreeFull(
		parseTape,
		lexTape.tokenString,
		originalIndexMapping,
	));
	// todo: postprocess errors to transform the filtered token indexes 
	// into original token indexes
	
	return assembleParseResult(emptyCompiledExpression(), errors);
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
): ParseResult{
	return {
		output: output,
		errors: Object.freeze(errors),
	}
}