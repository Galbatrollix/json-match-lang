// first return is count of consumed characters,
// second return is true if lex succeeded false otherwise
export type LexFunction = (
	charList: Array<string>,
 	current: number,
	end: number
) => [number, boolean];


const OperatorsSyntax = {
	CHILD:               ">",
	PARENT:              "<",

	SIBLING_NEXT:        "+",
	SIBLING_PREV:        "-",
	SIBLING_SUBSEQUENT:  "++",
	SIBLING_PRECEDING:   "--",
	SIBLING_ANY:         "~",

	OR:                  "|",
	AND:                 "&",
	NOT:                 "!",
	
	// not operators but have special syntax so
	L_BRACKET:           "[",
	R_BRACKET:           "]",
	L_BRACE:             "{",
	R_BRACE:             "}",
	WILDCARD:            "*",
	PRIMITIVE:           "#",
	STRING:              `"`,
} as const;

/*

	MAIN LEX FUNCTIONS

*/
export namespace funcs {
	export function lexOperatorChild(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(OperatorsSyntax.CHILD, charList, current, end);
	}

	export function lexOperatorParent(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(OperatorsSyntax.PARENT, charList, current, end);
	}

	export function lexOperatorSiblingNext(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(OperatorsSyntax.SIBLING_NEXT, charList, current, end);
	}

	export function lexOperatorSiblingPrev(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(OperatorsSyntax.SIBLING_PREV, charList, current, end);
	}

	export function lexOperatorSiblingSubsequent(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(OperatorsSyntax.SIBLING_SUBSEQUENT, charList, current, end);
	}

	export function lexOperatorSiblingPreceding(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(OperatorsSyntax.SIBLING_PRECEDING, charList, current, end);
	}

	export function lexOperatorSiblingAny(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(OperatorsSyntax.SIBLING_ANY, charList, current, end);
	}

	export function lexOperatorOr(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(OperatorsSyntax.OR, charList, current, end);
	}

	export function lexOperatorAnd(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(OperatorsSyntax.AND, charList, current, end);
	}

	export function lexOperatorNot(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(OperatorsSyntax.NOT, charList, current, end);
	}

	export function lexMatchWildcardAll(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(OperatorsSyntax.WILDCARD, charList, current, end);
	}
	const patternWildcardArray = OperatorsSyntax.L_BRACKET + OperatorsSyntax.WILDCARD + OperatorsSyntax.R_BRACKET;
	export function lexMatchWildcardArray(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(patternWildcardArray, charList, current, end);
	}
	const patternWildcardObject = OperatorsSyntax.L_BRACE + OperatorsSyntax.WILDCARD + OperatorsSyntax.R_BRACE;
	export function lexMatchWildcardObject(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(patternWildcardObject, charList, current, end);
	}
	const patternPrimitiveKindWildcard = OperatorsSyntax.PRIMITIVE + OperatorsSyntax.WILDCARD
	export function lexPrimitiveKindWildcard(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(patternPrimitiveKindWildcard, charList, current, end);
	}

	export function lexPrimitiveKindString(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(OperatorsSyntax.PRIMITIVE +"string", charList, current, end);
	}

	export function lexPrimitiveKindNumber(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(OperatorsSyntax.PRIMITIVE +"number", charList, current, end);
	}

	export function lexPrimitiveKindBoolean(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(OperatorsSyntax.PRIMITIVE +"boolean", charList, current, end);
	}

	export function lexPrimitiveNull(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(OperatorsSyntax.PRIMITIVE +"null", charList, current, end);
	}

	export function lexPrimitiveTrue(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(OperatorsSyntax.PRIMITIVE +"true", charList, current, end);
	}

	export function lexPrimitiveFalse(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchExact(OperatorsSyntax.PRIMITIVE +"false", charList, current, end);
	}

	export function lexWhitespace(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperTestMatchSequence(isWhitespaceChar, charList, current, end);
	}

	export function lexMatchKeyNaked(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperTestMatchSequence(isAsciiLetterChar, charList, current, end);
	}

	export function lexMatchIndexAll(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchInteger(charList, current, end);
	}

	export function lexMatchIndexArray(charList: Array<string>, current: number, end: number): [number, boolean] {
		const matchOpenBracket = function(charList: Array<string>, current: number, end: number){
			return helperMatchExact(OperatorsSyntax.L_BRACKET, charList, current, end);
		}
		const matchClosedBracket = function(charList: Array<string>, current: number, end: number){
			return helperMatchExact(OperatorsSyntax.R_BRACKET, charList, current, end);
		}
		return combinatorChain([
			matchOpenBracket, helperMatchInteger, matchClosedBracket
		])(charList, current, end);
	}

	export function lexMatchIndexObject(charList: Array<string>, current: number, end: number): [number, boolean] {
		const matchOpenBracket = function(charList: Array<string>, current: number, end: number){
			return helperMatchExact(OperatorsSyntax.L_BRACE, charList, current, end);
		}
		const matchClosedBracket = function(charList: Array<string>, current: number, end: number){
			return helperMatchExact(OperatorsSyntax.R_BRACE, charList, current, end);
		}
		return combinatorChain([
			matchOpenBracket, helperMatchInteger, matchClosedBracket
		])(charList, current, end);
	}

	export function lexMatchKey(charList: Array<string>, current: number, end: number): [number, boolean] {
		return helperMatchString(charList, current, end);
	}

	export function lexPrimitiveString(charList: Array<string>, current: number, end: number): [number, boolean] {
		const matchHash = function(charList: Array<string>, current: number, end: number){
			return helperMatchExact(OperatorsSyntax.PRIMITIVE, charList, current, end);
		}
		return combinatorChain([matchHash, helperMatchString ])(charList, current, end);
	}

	/*
		https://www.poppastring.com/blog/json-numbers-changed-with-leading-zeros
		
		Json number has 3 sections:
		1: string of digits with no leading zeros and possible minus in front.
		2: possibly: (a dot followed by string of digits)
		3: possibly: e or E followed by possible minus/plus and strings of digits
	*/
	export function lexPrimitiveNumber(charList: Array<string>, current: number, end: number): [number, boolean] {
		const matchHash = function(charList: Array<string>, current: number, end: number){
			return helperMatchExact("#", charList, current, end);
		}
		const matchMinus = function(charList: Array<string>, current: number, end: number){
			return helperMatchExact("-", charList, current, end);
		}
		const matchPlus = function(charList: Array<string>, current: number, end: number){
			return helperMatchExact("+", charList, current, end);
		}
		const matchDot = function(charList: Array<string>, current: number, end: number){
			return helperMatchExact(".", charList, current, end);
		}
		const matchLowecaseE = function(charList: Array<string>, current: number, end: number){
			return helperMatchExact("e", charList, current, end);
		}
		const matchUppercaseE = function(charList: Array<string>, current: number, end: number){
			return helperMatchExact("E", charList, current, end);
		}

		const matchDigitString = function(charList: Array<string>, current: number, end: number){
			return helperTestMatchSequence(isDigitChar, charList, current, end);
		}
		const matchPlusOrMinus = combinatorOr([matchPlus, matchMinus]);
		const matchAnyE = combinatorOr([matchLowecaseE, matchUppercaseE])
		const optionalMinus = combinatorOptional(matchMinus);
		
		const section1 = combinatorChain([
			optionalMinus,
			helperMatchInteger,
		]);

		const section2 = combinatorOptional(combinatorChain([
			matchDot,
			matchDigitString,
		]));
		
		const section3 = combinatorOptional(combinatorChain([
			matchAnyE,
			combinatorOptional(matchPlusOrMinus),
			matchDigitString,
		]));
		
		const completeNumberLex = combinatorChain([matchHash, section1, section2, section3]);

		return completeNumberLex(charList, current, end);
	}

	/*
		Always the last lex function to be called.
		Runs forward looking until a whitespace or significant character is enountered.
		Always consumes at least 1 character.
	*/
	export function lexError(charList: Array<string>, current: number, end: number): [number, boolean] {
		const [consumed, matched] = helperTestMatchSequence(
			isNonWhitespaceNonOperatorChar,
			charList,
			current + 1,
			end,
		);
		
		if (! matched){
			return [1, true];
		}else{
			return [consumed + 1, true];
		}
		
	}

}

/*

	HELPER FUNCTIONS

*/

/*
	This function tries to match string pat to contents of 
	charList array, beggining at index current and extending no further than index end.
	End is assumed to be equal or smaller than charList.length 
	
	Returns [count of consumed characters, true] if match was found
	Returns [0, false] if match was NOT found
*/
function helperMatchExact(
	pat: string,
	charList: Array<string>,
	current: number,
	end: number,
): [number, boolean] {
	const remaining = end - current;
	if (remaining < pat.length){
		return [0, false];
	}
	
	let at = current;
	for (const c of pat) {
		if (c != charList[at]){
			return [0, false];
		}
		at += 1;
	}
	
	return [at - current, true];
}


// only for single characters 
function isDigitChar(c: string): boolean {
	return (c >= '0' && c <= '9');
}
// only for single characters
// potential for improvement here
// https://en.wikipedia.org/wiki/Whitespace_character
// https://langdev.stackexchange.com/questions/1/which-horizontal-whitespace-should-be-supported
// https://www.unicode.org/reports/tr14/
function isWhitespaceChar(c: string): boolean {
	return " \f\n\r\t\v\u00A0\u2028\u2029".includes(c);
}
// only for single characters
function isAsciiLetterChar(c: string): boolean {
	const code = c.charCodeAt(0);
	return ( code >= 65 && code <= 90 || code >= 97 && code <= 122 );
}

const allOperators = Object.values(OperatorsSyntax) as Array<string>;
const allOperatorsJoined = allOperators.join("");
// only for single characters
function isOperatorChar(c: string): boolean {
	return allOperatorsJoined.includes(c);
}
function isNonWhitespaceNonOperatorChar(c: string): boolean {
	return !isOperatorChar(c) && !isWhitespaceChar(c);
}


/*
	This function tries to match longest string 
	containing only characters that pass the test
	provided via test function parameter.
*/
function helperTestMatchSequence(
	test: (c: string) => boolean,
	charList: Array<string>,
	current: number,
	end: number,
): [number, boolean] {
	let at = current;
	for (;at < end; at++) {
		const c = charList[at];	
		if (! test(c)){
			break;
		}
	}
	const consumed = at - current;

	if (consumed){
		return [consumed, true];
	}else{
		return [0, false];
	}

}

/*
	Expected to call on digit-only sequences
	Will return true only if: 
		1st character is not zero.
	OR
		end - current == 1 && charList[current] == 0
	Assumes end - current >= 1
	
*/
function helperNoLeadingZeroes(
	charList: Array<string>,
	current: number,
	end: number,
): boolean {
	const first = charList[current];
	if (first != '0'){
		return true;
	}
	// first is zero
	if (end - current == 1){
		return true;
	}
	return false;
	
}	

/*
	Matches sequence of consecutive digits if it has no leading zeros.
	A single zero will match if followed by non-digit character.
*/
function helperMatchInteger(
	charList: Array<string>,
	current: number,
	end: number
): [number, boolean] {
	const [consumed, success] = helperTestMatchSequence(isDigitChar, charList, current, end);
	if (!success){
		return [0, false];	
	}
	const leadingZerosOk = helperNoLeadingZeroes(charList, current, current + consumed);
	if (leadingZerosOk) {
		return [consumed, true];
	}else{
		return [0, false];	
	}
}
//todo https://stackoverflow.com/questions/58916957/is-an-empty-string-a-valid-json-key
/*
	Will match an arbitrary string starting and ending with " character
	Handles backslash escapes in manner compatible with json
*/
function helperMatchString(
	charList: Array<string>,
	current: number,
	end: number
): [number, boolean] {
	
	// must at least have room for 2 " characters
	const remaining = end - current;
	if (remaining < 2){
		return [0, false];
	}
	// must start with a " character.
	if (charList[current] != '"'){
		return [0, false];
	}
	//moving pointer past first doublequote
	let at = current + 1;

	let precedingBackslashes = 0;
	for (;at < end; at++) {
		const c = charList[at];	

		let escaped: boolean = precedingBackslashes % 2 == 1
		if (c == '"' && !escaped ){
			const consumed = at - current + 1;
			return [consumed, true];
		}

		if (c == '\\'){
			precedingBackslashes += 1;	
		}else{
			precedingBackslashes = 0;
		}
	}
	
	//charList ran out of characters without matching the string, match failed
	return [0, false];
}

/*
	Parser combinator that tranforms an array of lex functions into a single lex
	function that matches if and only if all given functions match in provided order.
*/
function combinatorChain(lexerList: Array<LexFunction> ): LexFunction {

	const resultFunc = function(
		charList: Array<string>,
		current: number,
		end: number
	): [number, boolean] {
		let at = current;		
		// loop doesnt perform bound checks on charList as some lex functions
		// can return true with 0 tokens consumed (optionals)
		let fnIndex = 0;
		for (;fnIndex < lexerList.length; fnIndex++) {
			const [consumed, matched] = lexerList[fnIndex](charList, at, end);
			if (! matched){
				return [0, false];
			}
			at += consumed;
		}

		const consumedTotal = at - current;
		const allFunctionsPassed: boolean = (fnIndex == lexerList.length);
		if (allFunctionsPassed){
			return [consumedTotal, true];
		}else{
			return [0, false];
		}
	}

	return resultFunc;
}


/*
	Parser combinator that tranforms an array of lex functions into a single lex
	function that matches if at least one of the given functions matches.

	If multiple functions match , then:
	resulting lex function will match the one encountered first

*/
function combinatorOr(lexerList: Array<LexFunction> ): LexFunction {

	const resultFunc = function(
		charList: Array<string>,
		current: number,
		end: number
	): [number, boolean] {
		for (const fn of lexerList){
			const [consumed, matched] = fn(charList, current, end);
			if (matched){
				return [consumed, true];
			}
		}	
		// not a single one matched
		return [0, false]
	}

	return resultFunc;
}

/*
	Parse combinator that tranforms a single lex function into a new one.
	Returned function passes with identical results if provided function passes.
	If provided function fails, returned function passes with 0 characters consumed.
*/
function combinatorOptional(lexerFunc: LexFunction): LexFunction {
	const resultFunc = function(
		charList: Array<string>,
		current: number,
		end: number
	): [number, boolean] {
		const [consumed, matched] = lexerFunc(charList, current, end);
		
		if (matched) {
			return [consumed, matched];
		}else{
			return [0, true];	
		}
	}

	return resultFunc;

}