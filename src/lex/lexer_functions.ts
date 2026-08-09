/**
	Exported namespace "funcs" with lex functions is at the end of the file.
*/

/**
	A function type representing a lexer component.
	A conforming function attempts to parse some kind of character
	sequence in charList, starting from index start and ending before 
	index end.
	
	first return - consumed - is count of consumed characters on lexer match,
	second return - matched - is true if lex matched or false otherwise

	Constraints:
		start <= end
		end <= charList.length
		start >= 0
		consumed <= end - start
*/
export type LexFunction = (
	charList: Array<string>,
 	start: number,
	end: number
) => [consumed: number, matched: boolean];


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
	// are used to stop error token lex function
	// and construct some lexer functions
	L_BRACKET:           "[",
	R_BRACKET:           "]",
	L_BRACE:             "{",
	R_BRACE:             "}",
	L_PARENTHESIS:       "(",
	R_PARENTHESIS:       ")",
	WILDCARD:            "*",
	PRIMITIVE:           "#",
	STRING:              `"`,
} as const;



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

	PARSER GENERATORS AND COMBINATORS

*/


/**
	Parser generator that produces a lex function that:
		tries to match longest string containing only characters
		that pass the test provided via test function parameter.
		If first character doesn't pass th test, function will return [0, false]
*/
function createMatchTestSequence(test: (c: string) => boolean): LexFunction {
	const resultFunc = function(
		charList: Array<string>,
		start: number,
		end: number
	): [number, boolean] {
		let at = start;
		for (;at < end; at++) {
			const c = charList[at];	
			if (! test(c)){
				break;
			}
		}
		const consumed = at - start;

		if (consumed){
			return [consumed, true];
		}else{
			return [0, false];
		}
	}
	return  resultFunc;
}


/**
	Parser generator that produces a lex function that:
		will either exactly match pattern string by consuming pattern.length 
		characters or will fail and return [0, false]
*/
function createMatchExact(pattern: string): LexFunction {
	const patternCodepoints: Array<string> = Array.from(pattern);

	const resultFunc = function(
		charList: Array<string>,
		start: number,
		end: number
	): [number, boolean] {
		const remaining = end - start;

		// cannot possibly match if there is not enough available characters
		if (remaining < patternCodepoints.length){
			return [0, false];
		}
		
		for (let i = 0; i < patternCodepoints.length; i++){
			const at = i + start;
			if (patternCodepoints[i] != charList[at]){
				return [0, false];
			}
		}
		
		return [patternCodepoints.length, true];
	}

	return resultFunc;
}

/**
	Parser generator that produces a lex function that:
		will either  match a non-empty and non-full prefix of pattern string 
		by consuming <1, pattern.length - 1> characters until characters in charList
		are exhausted.
		
		If the entire pattern string can match, function will throw an error.
		If not a single character can match, function will return [0, false].
		If a valid prefix matches, but not all characters are consumed, 
			function will also fail and will return [0, false]
		Otherwise: function will return [prefixLength, true],
			 which must be equal to [end - start, true].
*/
function createMatchIncompleteExact(pattern: string): LexFunction {
	const patternCodepoints: Array<string> = Array.from(pattern);

	const resultFunc = function(
		charList: Array<string>,
		start: number,
		end: number
	): [number, boolean] {
		const remaining = end - start;
		
		// nothing can match if there is no characters remaining
		if (remaining == 0){
			return [0, false];
		}
		
		const charsToScan = Math.min(remaining, patternCodepoints.length);
		
		for (let i = 0; i < charsToScan; i++){
			const at = i + start;
			
			if (patternCodepoints[i] != charList[at]){
				return [0, false];
			}
		}	
	
		//all chars to scan matched
		if (charsToScan == patternCodepoints.length){
			throw new Error("Match incomplete exact matched a complete pattern")
		}else{
			return [remaining, true];
		}
		
	}

	return resultFunc;
}


/**
	Parser combinator that tranforms an array of lex functions into a single lex
	function that matches if and only if all given functions match in provided order.
*/
function combinatorChain(lexerList: Array<LexFunction> ): LexFunction {

	const resultFunc = function(
		charList: Array<string>,
		start: number,
		end: number
	): [number, boolean] {
		let at = start;		
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

		const consumedTotal = at - start;
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
		start: number,
		end: number
	): [number, boolean] {
		for (const fn of lexerList){
			const [consumed, matched] = fn(charList, start, end);
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
// function combinatorOptional(lexerFunc: LexFunction): LexFunction {
// 	const resultFunc = function(
// 		charList: Array<string>,
// 		start: number,
// 		end: number
// 	): [number, boolean] {
// 		const [consumed, matched] = lexerFunc(charList, start, end);
		
// 		if (matched) {
// 			return [consumed, matched];
// 		}else{
// 			return [0, true];	
// 		}
// 	}

// 	return resultFunc;

// }

/*

	PARSER PRIMITIVES

*/


/**
	Matches a sequence of at least 1 consecutive digits.
*/
const matchDigitSequence: LexFunction = createMatchTestSequence(isDigitChar);

/*
	Matches sequence of consecutive digits if it has no leading zeros.
	A single zero will match if followed by non-digit character or end 
	of characters stream.
*/
function matchInteger(
	charList: Array<string>,
	start: number,
	end: number
): [number, boolean] {
	const [consumed, success] = matchDigitSequence(charList, start, end);
	if (!success){
		return [0, false];	
	}
	const firstIsZero: boolean = charList[start] == '0';

	if (firstIsZero && consumed != 1){
		return [0, false];
	}else {
		return [consumed, true];
	}
}

/**
	Will match an arbitrary string starting and ending with " character
	Does not validate json-conformance fully, which is left for later
	in processing pipeline.

	Handles backslash escapes in manner compatible with json. That is - 
	any valid json string will be correctly tokenized by this function.
	But some invalid strings (such as having nonsense \escapes) will be too. 
*/
function matchString(
	charList: Array<string>,
	start: number,
	end: number
): [number, boolean] {
	
	// must at least have room for 2 " characters
	const remaining = end - start;
	if (remaining < 2){
		return [0, false];
	}
	// must start with a " character.
	if (charList[start] != '"'){
		return [0, false];
	}
	//moving pointer past first doublequote
	let at = start + 1;

	let precedingBackslashes = 0;
	for (;at < end; at++) {
		const c = charList[at];	

		const escaped: boolean = precedingBackslashes % 2 == 1
		if (c == '"' && !escaped ){
			const consumed = at - start + 1;
			return [consumed, true];
		}

		if (c == '\\'){
			precedingBackslashes += 1;	
		}else{
			precedingBackslashes = 0;
		}
	}
	
	// charList ran out of characters without matching the string, match failed
	return [0, false];
}

/**
 	Similar to matchString, except it matches only incomplete strings -
	that is strings that have opening quote and do not run into
	closing qote before running out of characters in charList.

	Will throw error if it matches a complete string. It should be called
	after the normal string function determined there is no complete string match.
*/
function matchIncompleteString(
	charList: Array<string>,
	start: number,
	end: number
): [number, boolean] {
	
	// must at least have room for " character
	const remaining = end - start;
	if (remaining < 1){
		return [0, false];
	}
	// must start with a " character.
	if (charList[start] != '"'){
		return [0, false];
	}

	//moving pointer past first doublequote
	let at = start + 1;

	let precedingBackslashes = 0;
	for (;at < end; at++) {
		const c = charList[at];	

		const escaped: boolean = precedingBackslashes % 2 == 1
		if (c == '"' && !escaped ){
			throw new Error(
				"Fatal error: incomplete string match called on complete string"+
				" Make sure to verify complete string doesnt match first!"
			);
		}

		if (c == '\\'){
			precedingBackslashes += 1;	
		}else{
			precedingBackslashes = 0;
		}
	}
	
	// charList ran out of characters without matching the string,
	// this means that the incomplete string match condition is fulfilled
	return [end - start, true];
}



const matchOpenBracket = createMatchExact(OperatorsSyntax.L_BRACKET);
const matchClosedBracket = createMatchExact(OperatorsSyntax.R_BRACKET);
const matchOpenBrace = createMatchExact(OperatorsSyntax.L_BRACE);
const matchClosedBrace = createMatchExact(OperatorsSyntax.R_BRACE);
const matchPrimitivePrefix = createMatchExact(OperatorsSyntax.PRIMITIVE);


/**
	A bunch of things that together represent a finite state machine
	designed to parse valid JSON numbers, designed to be also usable
	for determining partial number matches.
*/
namespace numberFSM {
	/*
		https://www.poppastring.com/blog/json-numbers-changed-with-leading-zeros
		https://www.json.org/json-en.html
		https://ecma-international.org/wp-content/uploads/ECMA-404_2nd_edition_december_2017.pdf
		
		Json number has 3 sections:
		1: string of digits with no leading zeros and possible minus in front.
		2: possibly: (a dot followed by string of digits)
		3: possibly: (e or E followed by possible minus/plus followed by string of digits)
	*/
	
	export const states = {
		START: 0,
		AFTER_LEADING_ZERO: 1,
		DIGIT_SECTION_ONE: 2,
		AFTER_DOT: 3,
		DIGIT_SECTION_TWO: 4,
		AFTER_E: 5,
		DIGIT_SECTION_THREE: 6,

		FINISHED: 999,
		FAILED: 1000,
	} as const;
	type state = typeof states[keyof typeof states];

	
	export type FSM = {
		mainState: state,
		optionalMinusDone: boolean,
		plusMinusDone: boolean,
	}
	
	export function init(): FSM {
		return {
			mainState: states.START,
			optionalMinusDone: false,
			plusMinusDone: false,
		}
	}

	export function progress(fsm: FSM, char: string): void {
		const isDigit: boolean = isDigitChar(char);

		switch (fsm.mainState){
			case states.START: {
				if (char == '-' && ! fsm.optionalMinusDone){
					fsm.optionalMinusDone = true;
					// continues in state START
				}else if (char == '0'){
					fsm.mainState = states.AFTER_LEADING_ZERO;
				}else if (isDigit){
					fsm.mainState = states.DIGIT_SECTION_ONE;
				}else{
					fsm.mainState = states.FAILED;
				}
			}
			return;
			case states.AFTER_LEADING_ZERO: {
				if (char == "."){
					fsm.mainState = states.AFTER_DOT;
				}else if (char == 'e' || char == 'E'){
					fsm.mainState = states.AFTER_E;
				}else{
					fsm.mainState = states.FINISHED;
				}		
			}
			return;
			case states.DIGIT_SECTION_ONE: {
				if (char == "."){
					fsm.mainState = states.AFTER_DOT;
				}else if (char == 'e' || char == 'E'){
					fsm.mainState = states.AFTER_E;
				}else if (isDigit){
					// continues in state DIGIT_SECTION_ONE
				}else{
					fsm.mainState = states.FINISHED;
				}		
			}
			return;
			case states.AFTER_DOT:{
				if (isDigit){
					fsm.mainState = states.DIGIT_SECTION_TWO;
				}else{
					fsm.mainState = states.FAILED;
				}
			}
			return;
			case states.DIGIT_SECTION_TWO: {
				if (char == 'e' || char == 'E'){
					fsm.mainState = states.AFTER_E;
				}else if (isDigit){
					// continues in state DIGIT_SECTION_TWO
				}else{
					fsm.mainState = states.FINISHED;
				}		
			}
			return;
			case states.AFTER_E: {
				if ((char == '-' || char == '+') && ! fsm.plusMinusDone){
					fsm.plusMinusDone = true;
					// continues in state AFTER_E
				}else if (isDigit){
					fsm.mainState = states.DIGIT_SECTION_THREE;
				}else {
					fsm.mainState = states.FAILED;
				}
			}
			return;
			case states.DIGIT_SECTION_THREE: {
				if (isDigit){
					// continues in state DIGIT_SECTION_THREE
				}else{
					fsm.mainState = states.FINISHED;
				}		
			}
			return;
			case states.FAILED:
			case states.FINISHED: {
				throw new Error("Fatal error, number state machine called after finishing");
			}
			default: fsm.mainState satisfies never;				
		}
	}
}

/**
	Lex function that matches any JSON conformant number, 
	trying to go as far as possible when matching.
*/
function matchJsonNumber(
	charList: Array<string>,
 	start: number,
	end: number
): [number, boolean] {

	const fsm: numberFSM.FSM = numberFSM.init();
	for (let at = start; at < end; at++){
		const c = charList[at];
		
		numberFSM.progress(fsm, c);
		if(fsm.mainState == numberFSM.states.FINISHED){
			return [at - start, true];
		}else if (fsm.mainState == numberFSM.states.FAILED){
			return [0, false];
		}
		
	}
	// ran out of characters, so push a terminating char and read result.
	numberFSM.progress(fsm, " ");	
	if(fsm.mainState == numberFSM.states.FINISHED){
		return [end - start, true];
	}else{
		return [0, false];
	}	
}
/**
	Similar to matchJsonNumber, but will match only
	if after consuming last character from the list the parsed
	number is not valid (such as 1.3e) as if there is e, valid number
	MUST have digits after e.

	If this function happens to parse a complete number it will
	throw an error. 
*/
function matchIncompleteJsonNumber(
	charList: Array<string>,
 	start: number,
	end: number
): [number, boolean] {

	const fsm: numberFSM.FSM = numberFSM.init();
	for (let at = start; at < end; at++){
		const c = charList[at];
		
		numberFSM.progress(fsm, c);
		if(fsm.mainState == numberFSM.states.FINISHED){
			throw new Error(
				"Fatal error: incomplete number match called on complete number"+
				" Make sure to verify complete number doesnt match first!"
			);
		}else if (fsm.mainState == numberFSM.states.FAILED){
			return [0, false];
		}
		
	}
	// ran out of characters, so push a terminating char and read result.
	numberFSM.progress(fsm, " ");	
	if(fsm.mainState == numberFSM.states.FINISHED){
		throw new Error(
			"Fatal error: incomplete number match called on complete number"+
			" Make sure to verify complete number doesnt match first!"
		);
	}else{ 
		return [end - start, true];
	}

}

/*

	MAIN LEX FUNCTIONS

*/
export namespace funcs {
	export const lexOperatorChild: LexFunction = createMatchExact(OperatorsSyntax.CHILD);

	export const lexOperatorParent: LexFunction = createMatchExact(OperatorsSyntax.PARENT);
	
	export const lexOperatorSiblingNext: LexFunction = createMatchExact(OperatorsSyntax.SIBLING_NEXT);
	
	export const lexOperatorSiblingPrev: LexFunction = createMatchExact(OperatorsSyntax.SIBLING_PREV);
	
	export const lexOperatorSiblingSubsequent: LexFunction = createMatchExact(OperatorsSyntax.SIBLING_SUBSEQUENT);
	
	export const lexOperatorSiblingPreceding: LexFunction = createMatchExact(OperatorsSyntax.SIBLING_PRECEDING);
	
	export const lexOperatorSiblingAny: LexFunction = createMatchExact(OperatorsSyntax.SIBLING_ANY);
	
	export const lexOperatorOr: LexFunction = createMatchExact(OperatorsSyntax.OR);

	export const lexOperatorAnd: LexFunction = createMatchExact(OperatorsSyntax.AND);

	export const lexOperatorNot: LexFunction = createMatchExact(OperatorsSyntax.NOT);

	export const lexMatchWildcardAll: LexFunction = createMatchExact(OperatorsSyntax.WILDCARD);

	export const lexParenthesisLeft: LexFunction = createMatchExact(OperatorsSyntax.L_PARENTHESIS);
	
	export const lexParenthesisRight: LexFunction = createMatchExact(OperatorsSyntax.R_PARENTHESIS);
	
	export const lexMatchWildcardArray: LexFunction = createMatchExact(
		OperatorsSyntax.L_BRACKET + OperatorsSyntax.WILDCARD + OperatorsSyntax.R_BRACKET
	);

	export const lexMatchWildcardObject: LexFunction = createMatchExact(
		OperatorsSyntax.L_BRACE + OperatorsSyntax.WILDCARD + OperatorsSyntax.R_BRACE
	);

	export const lexPrimitiveKindWildcard: LexFunction = createMatchExact(
		OperatorsSyntax.PRIMITIVE + OperatorsSyntax.WILDCARD
	);

	export const lexPrimitiveKindString: LexFunction = createMatchExact(
		OperatorsSyntax.PRIMITIVE + "string"
	);

	export const lexPrimitiveKindNumber: LexFunction = createMatchExact(
		OperatorsSyntax.PRIMITIVE + "number"
	);

	export const lexPrimitiveKindBoolean: LexFunction = createMatchExact(
		OperatorsSyntax.PRIMITIVE + "boolean"
	);

	export const lexPrimitiveNull: LexFunction = createMatchExact(
		OperatorsSyntax.PRIMITIVE + "null"
	);

	export const lexPrimitiveTrue: LexFunction = createMatchExact(
		OperatorsSyntax.PRIMITIVE + "true"
	);

	export const lexPrimitiveFalse: LexFunction = createMatchExact(
		OperatorsSyntax.PRIMITIVE + "false"
	);

	export const lexWhitespace: LexFunction = createMatchTestSequence(isWhitespaceChar);
	
	export const lexMatchKeyNaked: LexFunction = createMatchTestSequence(isAsciiLetterChar);
	
	export const lexMatchIndexAll: LexFunction = matchInteger;

	export const lexMatchIndexArray: LexFunction = combinatorChain(
		[matchOpenBracket, matchInteger, matchClosedBracket]
	);

	export const lexMatchIndexObject: LexFunction = combinatorChain(
		[matchOpenBrace, matchInteger, matchClosedBrace]
	);

	export const lexMatchKey: LexFunction = matchString;
	
	export const lexPrimitiveString: LexFunction = combinatorChain(
		[matchPrimitivePrefix, matchString]
	);
	
	export const lexPrimitiveNumber = combinatorChain(
		[matchPrimitivePrefix, matchJsonNumber]
	);
	
	export const lexErrorIncompleteKey = matchIncompleteString;
	
	export const lexErrorIncompletePrimitive = combinatorOr([
		createMatchIncompleteExact(OperatorsSyntax.PRIMITIVE + "string"),
		createMatchIncompleteExact(OperatorsSyntax.PRIMITIVE + "number"),
		createMatchIncompleteExact(OperatorsSyntax.PRIMITIVE + "boolean"),
		createMatchIncompleteExact(OperatorsSyntax.PRIMITIVE + "null"),
		createMatchIncompleteExact(OperatorsSyntax.PRIMITIVE + "true"),
		createMatchIncompleteExact(OperatorsSyntax.PRIMITIVE + "false"),
		combinatorChain(
		 	[matchPrimitivePrefix, matchIncompleteString],
		),
		combinatorChain(
			[matchPrimitivePrefix, matchIncompleteJsonNumber],
		),
	]);
	
	export const lexErrorIncompleteArray = combinatorOr([]);
	
	export const lexErrorIncompleteObject = combinatorOr([]);
	
	/*
		Always the last lex function to be called.
		Runs forward looking until a whitespace or significant character is enocuntered.
		Always consumes at least 1 character and always matches.
	*/
	export function lexError(charList: Array<string>, start: number, end: number): [number, boolean] {
		const matchUntilReset = createMatchTestSequence(isNonWhitespaceNonOperatorChar);

		const [consumed, matched] = matchUntilReset(
			charList,
			start + 1,
			end,
		);
		
		if (! matched){
			return [1, true];
		}else{
			return [consumed + 1, true];
		}
		
	}

}