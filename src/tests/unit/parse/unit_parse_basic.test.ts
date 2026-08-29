import {lexer} from "../../../main.ts"
import {parser} from "../../../main.ts"

/**
	Expected error tapes maps a parse error kind to array of strings
	that will generate token tapes resulting in that error kind.
*/
const expectedErrorStrings: Readonly<Record<parser.ParseErrorKind, Array<string>>> = {
	[parser.ParseErrorKind.FOUND_ERROR_TOKENS]: [
		`dupa, kupa`,
		'dupa {{{ "array"',
		"\\\\\\\\\\",
		`>> #"this is incomplete string`,
		`++ "this is incomplete string2`,
		`dupa > {0`,
		`czort << [`,
		`number is a tough cookie aimirite > #3.14e`,
		`#stri`,
	],
	[parser.ParseErrorKind.INDEX_OUT_OF_BOUNDS]: [
		`{11111111111111111111111111111111111111111111111111111} > #"czort"`,
		`4294967295 + {0} - {4}`, // 4294967295 is uint32max
		` [` + `9`.repeat(1000000) + `] > #3.1415e-1`,
	], 
	[parser.ParseErrorKind.STRING_NOT_VALID_JSON]: [
		String.raw`"dupixx\m"`,
		String.raw`#"dupixx\m" >> kipixx`,
		String.raw`"bakerinĄĄĄ\u123zzz" << bakix`,
		String.raw`#"bakerinĄĄĄ\ufffgzzz"`,
	],
	[parser.ParseErrorKind.STACK_OVERFLOW]: [
		`!`.repeat(1000000) + `dupa`,
		`(`.repeat(1000000) + `#"zonk"` + `)`.repeat(1000000),
	],
	[parser.ParseErrorKind.WRONG_SYNTAX]: [
		`dupa + kupa || siki - czort`,
		` > & 667`,
		`dupa < kupa > ((( 8 | 9 | 10 | 11 ))`,
		`!((!(!( dupa && {0}))))`,
		`foo > bar > "baz " > ( sako | wacko > kicz`,
		`foo ! > bar`,
		`moloko cyka kot babuszka | kolbasa )`,
	],
}

/**
	Expected error tapes maps a parse error kind to an
	array of token tapes that is expected to generate such error.
*/
const expectedErrorTapes = {} as Record<parser.ParseErrorKind, Array<lexer.TokenTape>>;
for (const [k, strings] of Object.entries(expectedErrorStrings)){
	const kind = Number(k) as parser.ParseErrorKind;
	expectedErrorTapes[kind] = strings.map(
		lexer.tokenizeExpressionString,
	);
}
/**
	Ensures expected errors are emitted for faulty inputs and that
	errors are not invalid (such as containing undefined or out of bounds indexes)
	
	Ensures that alongside errors, an empty but valid parse tape is returned.
*/
export function parseTestErrorResults(): boolean {
	for (const [k, tokenTapes] of Object.entries(expectedErrorTapes)){
		const kind = Number(k) as parser.ParseErrorKind;

		for (const tokenTape of tokenTapes){
			const result = parser.parseExpressionTokens(tokenTape);
			const tapeOk = parser.ExpressionParseTapeUtils.Debug.integrityCheckDeep(
				result.parseTape, tokenTape
			);
			
			// returned tape must be empty but valid on error
			if (! tapeOk || result.parseTape.pairCount != 0){
				return false;
			}	
			
			// returned errors must contain an item of expected kind
			if (! errorsContainKind(result.errors, kind)){
				return false;
			}
			
			// returned errors must be well formed
			if (! errorsOkIndexes(result.errors, tokenTape.tokenCount)){
				return false;
			}
		}
	}
	return true;
}


/**
	Returns true if at least one errors in given array is the same kind as target
*/
function errorsContainKind(
	errors: Readonly<Array<parser.ParseError>>, target: parser.ParseErrorKind
): boolean {
	for (const err of errors) {
		if (err.kind == target) return true;
	}
	return false;
}

/**
	Returns true if all errors in array 
	are within token tape index range and are not undefined
*/
function errorsOkIndexes(
	errors: Readonly<Array<parser.ParseError>>, tokenCount: number,
): boolean {
	for (const err of errors) {
		for (const idx of err.tokenIndexes){
			if (idx === undefined){
				return false;
			}
			if (idx < 0 || idx >= tokenCount){
				return false;
			}
		}
	}
	return true;
}


