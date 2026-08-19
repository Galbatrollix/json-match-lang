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
import {generateRawExpressionParseTape} from "./parser_impl.ts"
import {
	type RawExpressionParseTape,
	type ExpressionParseTape,

	RawExpressionParseTapeUtils,
	ExpressionParseTapeUtils,
} from "./parser_types.ts"

import {
	postprocessCollapseTreesInPlace,
	postprocessTransformRawTapeToFinal,
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

	const parseOutput = generateRawExpressionParseTape(filteredTokens);
	const parseTape: RawExpressionParseTape = parseOutput.parseTape;
	const incompleteErrors: Array<IncompleteParseError> = parseOutput.errors;

	const errors: Array<ParseError> = parseErrorsFromIncomplete(
		incompleteErrors,
		originalIndexMapping
	);

	if (errors.length){
		return assembleParseResult(
			emptyCompiledExpression(), errors
		);
	};

	console.log(RawExpressionParseTapeUtils.Display.asTreeFull(
		parseTape,
		lexTape.tokenString,
		originalIndexMapping,
	));
	postprocessCollapseTreesInPlace(parseTape);
	

	console.log(RawExpressionParseTapeUtils.Display.asTreeFull(
		parseTape,
		lexTape.tokenString,
		originalIndexMapping,
	));

	// transform converts type of parseTape 
	//      from RawExpressionParseTape to ExpressionParseTape
	// previous item is invalidated and converted in place, hence:
	//      the hard type cast is necessary
	postprocessTransformRawTapeToFinal(parseTape, originalIndexMapping);
	const parseTapeResult = parseTape as unknown as ExpressionParseTape;

	console.log(ExpressionParseTapeUtils.Display.asTree(
		parseTapeResult, lexTape, true
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