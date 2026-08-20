import * as lexer from "./../lex/lexer_a_index.ts"
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
} from "./parser_types.ts"

import {
	postprocessCollapseTreesInPlace,
	postprocessTransformRawTapeToFinal,
} from "./parser_postprocess.ts"


export type ParseResult = Readonly<{
	parseTape: ExpressionParseTape,
	errors: Readonly<Array<ParseError>>,
}>;


//todo: go over lexer and maybe reorganize it so it makes more sense, update docstrings and
// names perhaps too

export function parseExpressionTokens(lexTape: lexer.TokenTape): ParseResult {
	
	// find any critical and easy to spot errors with supplied token lexTape
	const preprocessingErrors: Array<ParseError> = preprocessFindInvalidTokens(lexTape);
	if (preprocessingErrors.length){
		return assembleParseResult(
			emptyParseTape(), preprocessingErrors 
		);
	}

	const filterResult = preprocessFilterWhitespace(lexTape);

	const filteredTokens: Array<lexer.TokenKind> = filterResult.tokens;
	const originalIndexMapping: Array<number> = filterResult.mapping;

	const parseOutput = generateRawExpressionParseTape(filteredTokens);
	const rawParseTape: RawExpressionParseTape = parseOutput.parseTape;
	const incompleteErrors: Array<IncompleteParseError> = parseOutput.errors;

	const errors: Array<ParseError> = parseErrorsFromIncomplete(
		incompleteErrors,
		originalIndexMapping
	);

	if (errors.length){
		return assembleParseResult(
			emptyParseTape(), errors
		);
	};

	postprocessCollapseTreesInPlace(rawParseTape);
	
	// transform converts type of rawParseTape 
	//      from RawExpressionParseTape to ExpressionParseTape
	// previous item is invalidated and converted in place, hence:
	//      the hard type cast is necessary
	postprocessTransformRawTapeToFinal(rawParseTape, originalIndexMapping);
	const parseTape = rawParseTape as unknown as ExpressionParseTape;

	
	return assembleParseResult(parseTape, []);
}


function emptyParseTape(): ExpressionParseTape {
	return Object.freeze({
		pairCount: 0,
		combinators: Object.freeze([]),
		constraints: Object.freeze([]),
	});
}

/**
	Turns parse result parts and assembles them into final 
	object and performs necessary freezing operations.

	Arrays given as parameters may be modified (frozen)
*/
function assembleParseResult(
	output: ExpressionParseTape,
	errors: Array<ParseError>,
): ParseResult{
	return {
		parseTape: output,
		errors: Object.freeze(errors),
	}
}