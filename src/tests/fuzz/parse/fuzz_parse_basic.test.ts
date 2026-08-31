import {lexer} from "../../../main.ts"
import {parser} from "../../../main.ts"
import {
	randomInRange,
	dumpStringToUniqueFile,
} from "../fuzz_helpers.test.js"


/**
	Returns a string with tokenkind enum values encoded into a string
	that can dumped to file.
*/
function dumpTokensToString(tokens: Readonly<Array<lexer.TokenKind>>): string {
	const toJoin = tokens.map((x) => String(x));
	return `[` + toJoin.join(', ') + `]`;
}

/**
	Bombards parser with random but valid token tapes and checks whether
	it doesnt crash and produces a well-formed output.
*/
export function parseFuzzRandom(batchSize: number, logDirPath: string): number {
	const maxTokenTapeLength = 1000;
	
	let failures = 0;

	for (let i = 0; i < batchSize; i++){
		const tokenTape: lexer.TokenTape = forgeTokenTape(0, maxTokenTapeLength);
		
		let fail: boolean = false;
		try {
			var parseResult = parser.parseExpressionTokens(tokenTape);
			fail = ! verifyForgedTapeResult(
				tokenTape, parseResult.parseTape, parseResult.errors,
			);
		}catch(e){
			fail = true;
		}
		
		if (fail){
			failures += 1;
			dumpStringToUniqueFile(
				logDirPath,
				parseFuzzRandom.name,
				dumpTokensToString(tokenTape.tokenKind),
			);
		}		
	
	}
	return failures;

}

/**
	Bombards parser with random token tapes containing some kind of error token
	and checks whether it doesnt crash and produces expected errors.
*/
export function parseFuzzErrors(batchSize: number, logDirPath: string): number {
	const maxTokenTapeLength = 1000;
	
	let failures = 0;

	for (let i = 0; i < batchSize; i++){
		const [
			tokenTape, 
			expectedErrorKind, 
			expectedErrorIdx,
		] = forgeTokenTapeWithErrors(maxTokenTapeLength);
		
		let fail: boolean = false;
		try {
			var parseResult = parser.parseExpressionTokens(tokenTape);
			fail = ! verifyErrorTapeResult(
				parseResult.parseTape,
				parseResult.errors,
				expectedErrorKind,
				expectedErrorIdx,
			);
		}catch(e){
			fail = true;
		}
		
		if (fail){
			failures += 1;
			dumpStringToUniqueFile(
				logDirPath,
				parseFuzzErrors.name,
				dumpTokensToString(tokenTape.tokenKind),
			);
		}		
	
	}
	return failures;

}


/**
	Creates an artificial, lexer.TokenTape value out of random tokens.
	Does not emit erroneous tokens, this includes overflown index,
	invalid JSON string and other error tokens detectable at parser stage.
	Length of generated token tape cannot exceed value passed by maxLength parameter.
	Length of generated token tape cannot be smaller than value passed by minLength parameter.
	If given minLength is 0, then result might be an empty token tape.

	Resulted TokenTape is expected to pass at least the deep integrity check.

	After ingesting this tape parser is expected to do one of the following:
		- generate parse tape successfully
		- emit syntax error (most likely)
		- emit stack overflow error (higly improbable, should be logged if encountered)

	An exeception throw after ingesting a forged tape, 
	or emitting a different kind of error than the above
	means there is an error in parser (or in this function).
*/
function forgeTokenTape(minLength: number, maxLength: number): lexer.TokenTape {
	const chosenSize = randomInRange([minLength, maxLength + 1]);
	
	const kinds: Array<lexer.TokenKind> = [];
	const strings: Array<string> = [];

	for (let i = 0; i < chosenSize; i++){
		const [k, s] = randomValidToken();
		kinds[i] = k;
		strings[i] = s;
	}
	
	return {
		tokenCount: chosenSize,
		tokenKind: kinds,
		tokenString: strings,
	};
}

/**
	Creates an artificial token tape containing 
	a single errorneous token somewhere. Returs the token tape
	alongside expected error kind and index where it exists.
*/
function forgeTokenTapeWithErrors(maxLength: number): 
	[lexer.TokenTape, parser.ParseErrorKind, number] {
	
	// uses forge token tape and then modifies it after the fact to insert wrong token
	const resultTape = forgeTokenTape(1, maxLength);
	
	const [tokenKind, str, errorKind] = errorTokenExamples[
		randomInRange([0, errorTokenExamples.length])
	];
	

	let replacementIdx: number = 0;
	if (lexer.TokenKindUtils.isErrorIncomplete(tokenKind)){
		replacementIdx = resultTape.tokenCount - 1;
	}else{
		replacementIdx = randomInRange([0, resultTape.tokenCount]);
	}
	
	// dropping readonliness for a second, forged tape is not frozen
	(resultTape as any).tokenKind[replacementIdx] = tokenKind;
	(resultTape as any).tokenString[replacementIdx] = str;

	return [resultTape, errorKind, replacementIdx];
}

/**
	Verifies whether result of running parser on
	a token tape forged by function forgeTokenTapeWithErrors
	is well formed according to specification.
*/
function verifyErrorTapeResult(
	parseTape: parser.ExpressionParseTape,
	errors: Readonly<Array<parser.ParseError>>,
	expectedErrorKind: parser.ParseErrorKind,
	expectedErrorIdx: number,
): boolean {
	// parse tape must be empty
	if (parseTape.pairCount != 0){
		return false;
	}
	// there must be only on error
	if (errors.length != 1){
		return false;
	}
	
	const err = errors[0];
	
	// the one error must be of expected kind
	if (err.kind != expectedErrorKind){
		return false;
	}
	
	// the one error must have only one token index
	if (err.tokenIndexes.length != 1){
		return false;
	}
	// the one token index of the error must be what is expected.
	if (err.tokenIndexes[0] != expectedErrorIdx){
		return false;
	}
	
	return true;
}
/**
	Verifies whether result of running parser on
	a token tape forged by function forgeTokenTape
	is well formed according to specification.
*/
function verifyForgedTapeResult(
	tokenTape: lexer.TokenTape,
	parseTape: parser.ExpressionParseTape,
	errors: Readonly<Array<parser.ParseError>>,
): boolean {
	const tapeOk: boolean = parser.ExpressionParseTapeUtils.Debug.integrityCheckDeep(
		parseTape, tokenTape,
	);
	const errorsOk: boolean = expectedForgedErrors(errors);
	
	if (!tapeOk || !errorsOk){
		return false;
	}
	
	const tapeEmpty = parseTape.pairCount == 0;
	const errorsFound = errors.length != 0;
	

	// non empty token tape should either result
	// in errors and empty tape
	// or no errors and non-empty tape
	// empty tape and no errors is allowed if and only if input tokens were only whitespace
	// todo emit error for empty inputs in parser
	
	if (errorsFound && !tapeEmpty){
		return false;
	}

	if (!errorsFound && tapeEmpty && !tokensAllWhitespace(tokenTape.tokenKind)){
		return false;
	}
	return true;
	
}

/**
	Returns true only if errors yielded from parsing forged token tape
	have expected contents or contain stack overflow error.
	(stack overflow is not invalid but suspiciously improbable so fuzzer shall
	consider it an error so its manually vetted)
*/
function expectedForgedErrors(errors: Readonly<Array<parser.ParseError>>): boolean {
	if (errors.length == 0){
		return true;
	}
	if (errors.length > 1){
		return false;
	}

	switch (errors[0].kind){
	case parser.ParseErrorKind.WRONG_SYNTAX:
		return true;
	default:
		return false;
	}

}

/**
	Returns true if and only if all token kinds in given array are whitespace tokens
*/
function tokensAllWhitespace(tokens: Readonly<Array<lexer.TokenKind>>): boolean {
	for (const tk of tokens){
		if (tk != lexer.TokenKind.WHITESPACE){
			return false;
		}
	}
	return true;
}

/**
	Returns a random pair of tokenkind and its respective string
	Expected to be used for forging token tapes.
*/
function randomValidToken(): [lexer.TokenKind, string] {
	return validTokenExamples[
		randomInRange([0, validTokenExamples.length])
	];
}

const validTokenExamples: ReadonlyArray<[lexer.TokenKind, string]> = [
	[lexer.TokenKind.WHITESPACE, ` `],
	[lexer.TokenKind.OPERATOR_CHILD,  `>`],
	[lexer.TokenKind.OPERATOR_PARENT, `<`],
	[lexer.TokenKind.OPERATOR_SIBLING_NEXT, `+`],
	[lexer.TokenKind.OPERATOR_SIBLING_PREV, `-`],
	[lexer.TokenKind.OPERATOR_SIBLING_SUBSEQUENT, `++`],
	[lexer.TokenKind.OPERATOR_SIBLING_PRECEDING, `--`],
	[lexer.TokenKind.OPERATOR_SIBLING_ANY, `~`],
	[lexer.TokenKind.OPERATOR_OR, `|`],
	[lexer.TokenKind.OPERATOR_AND, `&`],
	[lexer.TokenKind.OPERATOR_NOT, `!`],
	[lexer.TokenKind.PARENTHESIS_LEFT, `(`],
	[lexer.TokenKind.PARENTHESIS_RIGHT, `)`],
	[lexer.TokenKind.KEY_QUOTED, `"DUPA"`],
	[lexer.TokenKind.KEY_NAKED, `dupa`],
	[lexer.TokenKind.INDEX_ALL, `15`],
	[lexer.TokenKind.INDEX_ARRAY, `[14]`],
	[lexer.TokenKind.INDEX_OBJECT, `{13}`],
	[lexer.TokenKind.WILDCARD_ALL, `*`],
	[lexer.TokenKind.WILDCARD_ARRAY, `[*]`],
	[lexer.TokenKind.WILDCARD_OBJECT, `{*}`],
	[lexer.TokenKind.VALUE_TYPE_WILDCARD, `#*`],
	[lexer.TokenKind.VALUE_TYPE_STRING, `#string`],
	[lexer.TokenKind.VALUE_TYPE_NUMBER, `#number`],
	[lexer.TokenKind.VALUE_TYPE_BOOLEAN, `#boolean`],
	[lexer.TokenKind.VALUE_TYPE_ARRAY, `#[]`],
	[lexer.TokenKind.VALUE_TYPE_OBJECT, `#{}`],
	[lexer.TokenKind.VALUE_EXACT_NULL, `#null`],
	[lexer.TokenKind.VALUE_EXACT_TRUE, `#true`],
	[lexer.TokenKind.VALUE_EXACT_FALSE, `#false`],
	[lexer.TokenKind.VALUE_EXACT_NUMBER, `#0.222e-14`],
	[lexer.TokenKind.VALUE_EXACT_STRING, `#"str"`],
];


const errorTokenExamples: ReadonlyArray<
	[lexer.TokenKind, string, parser.ParseErrorKind]
> = [
	[lexer.TokenKind.ERROR,`/////` ,parser.ParseErrorKind.FOUND_ERROR_TOKENS ],
	[lexer.TokenKind.ERROR_INCOMPLETE_KEY,`"dup` ,parser.ParseErrorKind.FOUND_ERROR_TOKENS ],
	[lexer.TokenKind.ERROR_INCOMPLETE_OBJECT,`{` ,parser.ParseErrorKind.FOUND_ERROR_TOKENS ],
	[lexer.TokenKind.ERROR_INCOMPLETE_ARRAY,`[` ,parser.ParseErrorKind.FOUND_ERROR_TOKENS ],
	[lexer.TokenKind.ERROR_INCOMPLETE_VALUE,`#tr` ,parser.ParseErrorKind.FOUND_ERROR_TOKENS ],
	[lexer.TokenKind.KEY_QUOTED,String.raw`"unirip\u112"` ,parser.ParseErrorKind.STRING_NOT_VALID_JSON ],
	[lexer.TokenKind.INDEX_ALL,`4294967295` ,parser.ParseErrorKind.INDEX_OUT_OF_BOUNDS ],
	[lexer.TokenKind.INDEX_ARRAY,`[4294967295]` ,parser.ParseErrorKind.INDEX_OUT_OF_BOUNDS ],
	[lexer.TokenKind.INDEX_OBJECT,`{4294967295}` ,parser.ParseErrorKind.INDEX_OUT_OF_BOUNDS ],
	[lexer.TokenKind.VALUE_EXACT_STRING,String.raw`#"unirip\u112"` ,parser.ParseErrorKind.STRING_NOT_VALID_JSON ],
];
