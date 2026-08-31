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
		const tokenTape: lexer.TokenTape = forgeTokenTape(maxTokenTapeLength);
		
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
	Creates an artificial possibly-empty lexer.TokenTape value out of random tokens.
	Does not emit erroneous tokens, this includes overflown index,
	invalid JSON string and other error tokens detectable at parser stage.
	Length of generated token tape cannot exceed value passed by maxLength parameter.

	Resulted TokenTape is expected to pass at least the deep integrity check.

	After ingesting this tape parser is expected to do one of the following:
		- generate parse tape successfully
		- emit syntax error (most likely)
		- emit stack overflow error (higly improbable, should be logged if encountered)

	An exeception throw after ingesting a forged tape, 
	or emitting a different kind of error than the above
	means there is an error in parser (or in this function).
*/
function forgeTokenTape(maxLength: number): lexer.TokenTape {
	const chosenSize = randomInRange([0, maxLength + 1]);
	
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
	Verified whether result of running parser on
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