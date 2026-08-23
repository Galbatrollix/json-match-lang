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
	
	On successful match function should return:
		[charactersConsumed, true]
	On match fail function should return:
		[charactersConsumedUntilFail, false]

	Constraints:
		start <= end
		end <= charList.length
		start >= 0
		consumed <= end - start
*/
export type LexFunction = (
	charList: Readonly<Array<string>>,
 	start: number,
	end: number
) => [consumed: number, matched: boolean];

/**
	A collection of constants that constitute
	special syntax in expression language,
	be it operators or other separators.
*/
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
	VALUE:               "#",
	STRING:              `"`,
} as const;



/*
	Below functions are helpers used only for determining whether
	a single codepoint string belongs to a class of characters.
*/ 
function isDigitChar(c: string): boolean {
	return (c >= '0' && c <= '9');
}
// potential for improvement here
// https://en.wikipedia.org/wiki/Whitespace_character
// https://langdev.stackexchange.com/questions/1/which-horizontal-whitespace-should-be-supported
// https://www.unicode.org/reports/tr14/
function isWhitespaceChar(c: string): boolean {
	return " \f\n\r\t\v\u00A0\u2028\u2029".includes(c);
}
function isAsciiLetterChar(c: string): boolean {
	const code = c.charCodeAt(0);
	return ( code >= 65 && code <= 90 || code >= 97 && code <= 122 );
}
const allOperators = Object.values(OperatorsSyntax) as Readonly<Array<string>>;
const allOperatorsJoined = allOperators.join("");
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
		charList: Readonly<Array<string>>,
		start: number,
		end: number
	): [number, boolean] {
		for (var at = start; at < end; at++) {
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
		characters or will fail and return [charactersConsumedUntilFail, false]
*/
function createMatchExact(pattern: string): LexFunction {
	const patternCodepoints: Readonly<Array<string>> = Array.from(pattern);

	const resultFunc = function(
		charList: Readonly<Array<string>>,
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
				return [i, false];
			}
		}	
	
		//all chars to scan matched
		if (charsToScan == patternCodepoints.length){
			return [patternCodepoints.length, true];
		}else{
			return [remaining, false];
		}
	}
	return resultFunc;
}

/**
	Parser generator that produces a lex function that
	will match if and only if a non-empty and non-full prefix of pattern string matches
	by consuming <1, pattern.length - 1> characters until characters in charList
	are exhausted.
			
*/
function createMatchIncompleteExact(pattern: string): LexFunction {
	return combinatorIncomplete(createMatchExact(pattern));
}

/**
	Parser combinator that tranforms an array of lex functions into a single lex
	function that matches if and only if all given functions match in provided order.
*/
function combinatorChain(lexerList: Array<LexFunction> ): LexFunction {

	const resultFunc = function(
		charList: Readonly<Array<string>>,
		start: number,
		end: number
	): [number, boolean] {
		let at = start;		
		// loop doesnt perform bound checks on charList as some lex functions
		// can return true with 0 tokens consumed (optionals)
		for (let fnIndex = 0; fnIndex < lexerList.length; fnIndex++) {
			const [consumed, matched] = lexerList[fnIndex](charList, at, end);
			if (! matched){
				return [at - start + consumed, false];
			}
			at += consumed;
		}
		
		// all functions passed
		const consumedTotal = at - start;
		return [consumedTotal, true];
	}

	return resultFunc;
}

/**
	Parser combinator that tranforms an array of lex functions into a single lex
	function that matches if at least one of the given functions matches.

	If multiple functions match , then:
	resulting lex function will match the one encountered first

*/
function combinatorOr(lexerList: Array<LexFunction> ): LexFunction {

	const resultFunc = function(
		charList: Readonly<Array<string>>,
		start: number,
		end: number
	): [number, boolean] {
		let maxConsumed = 0;

		for (const fn of lexerList){
			const [consumed, matched] = fn(charList, start, end);
			if (matched){
				return [consumed, true];
			}
			maxConsumed = maxConsumed > consumed ? maxConsumed : consumed;
		}
		
		// not a single one matched
		return [maxConsumed, false];
	}

	return resultFunc;
}

/**
	Parser combinator that tranforms a lex function into another lex
	function that matches only if given lex function fails to match, but
	reaches the end of character list. Used for generating incomplete tokens.
*/
function combinatorIncomplete(lexFunc: LexFunction): LexFunction {
	const resultFunc = function(
		charList: Readonly<Array<string>>,
		start: number,
		end: number
	): [number, boolean] {
		const charsRemaining = end - start;

		const [consumed, matched] = lexFunc(charList, start, end);
		
		if (! matched && consumed == charsRemaining){
			return [consumed, true];
		}else{
			return [consumed, false];
		}
		
	}
	return resultFunc;

}

/*

	PARSER PRIMITIVES

*/


/**
	Matches a sequence of at least 1 consecutive digits.
*/
const matchDigitSequence: LexFunction = createMatchTestSequence(isDigitChar);

/**
	Matches sequence of consecutive digits if it has no leading zeros.
	A single zero will match if followed by non-digit character or end 
	of characters stream.
*/
function matchInteger(
	charList: Readonly<Array<string>>,
	start: number,
	end: number
): [number, boolean] {
	const [consumed, success] = matchDigitSequence(charList, start, end);
	if (!success){
		return [0, false];	
	}
	const firstIsZero: boolean = charList[start] == '0';

	if (firstIsZero && consumed != 1){
		return [1, false];
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
	charList: Readonly<Array<string>>,
	start: number,
	end: number
): [number, boolean] {
	
	// must at least have room for opening " character.
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
	return [end - start, false];
}

const matchOpenBracket = createMatchExact(OperatorsSyntax.L_BRACKET);
const matchClosedBracket = createMatchExact(OperatorsSyntax.R_BRACKET);
const matchOpenBrace = createMatchExact(OperatorsSyntax.L_BRACE);
const matchClosedBrace = createMatchExact(OperatorsSyntax.R_BRACE);
const matchValuePrefix = createMatchExact(OperatorsSyntax.VALUE);


/**
	A bunch of things that together represent a finite state machine
	designed to parse valid JSON numbers, designed to be also usable
	for determining partial number matches.
*/
namespace numberFSM {
	/*
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
	charList: Readonly<Array<string>>,
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
			return [at - start, false];
		}
		
	}
	// ran out of characters, so push a terminating char and read result.
	numberFSM.progress(fsm, " ");	
	if(fsm.mainState == numberFSM.states.FINISHED){
		return [end - start, true];
	}else{
		return [end - start, false];
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

	export const lexWildcardAll: LexFunction = createMatchExact(OperatorsSyntax.WILDCARD);

	export const lexParenthesisLeft: LexFunction = createMatchExact(OperatorsSyntax.L_PARENTHESIS);
	
	export const lexParenthesisRight: LexFunction = createMatchExact(OperatorsSyntax.R_PARENTHESIS);
	
	export const lexWildcardArray: LexFunction = createMatchExact(
		OperatorsSyntax.L_BRACKET + OperatorsSyntax.WILDCARD + OperatorsSyntax.R_BRACKET
	);

	export const lexWildcardObject: LexFunction = createMatchExact(
		OperatorsSyntax.L_BRACE + OperatorsSyntax.WILDCARD + OperatorsSyntax.R_BRACE
	);

	export const lexValueTypeWildcard: LexFunction = createMatchExact(
		OperatorsSyntax.VALUE + OperatorsSyntax.WILDCARD
	);

	export const lexValueTypeString: LexFunction = createMatchExact(
		OperatorsSyntax.VALUE + "string"
	);

	export const lexValueTypeNumber: LexFunction = createMatchExact(
		OperatorsSyntax.VALUE + "number"
	);

	export const lexValueTypeBoolean: LexFunction = createMatchExact(
		OperatorsSyntax.VALUE + "boolean"
	);

	export const lexValueExactNull: LexFunction = createMatchExact(
		OperatorsSyntax.VALUE + "null"
	);

	export const lexValueExactTrue: LexFunction = createMatchExact(
		OperatorsSyntax.VALUE + "true"
	);

	export const lexValueExactFalse: LexFunction = createMatchExact(
		OperatorsSyntax.VALUE + "false"
	);

	export const lexValueTypeArray: LexFunction =  createMatchExact(
		OperatorsSyntax.VALUE + OperatorsSyntax.L_BRACKET + OperatorsSyntax.R_BRACKET,
	);
	export const lexValueTypeObject: LexFunction = createMatchExact(
		OperatorsSyntax.VALUE + OperatorsSyntax.L_BRACE + OperatorsSyntax.R_BRACE,
	);

	export const lexWhitespace: LexFunction = createMatchTestSequence(isWhitespaceChar);
	
	export const lexKeyNaked: LexFunction = createMatchTestSequence(isAsciiLetterChar);
	
	export const lexIndexAll: LexFunction = matchInteger;

	export const lexIndexArray: LexFunction = combinatorChain(
		[matchOpenBracket, matchInteger, matchClosedBracket]
	);

	export const lexIndexObject: LexFunction = combinatorChain(
		[matchOpenBrace, matchInteger, matchClosedBrace]
	);

	export const lexKeyQuoted: LexFunction = matchString;
	
	export const lexValueExactString: LexFunction = combinatorChain(
		[matchValuePrefix, matchString]
	);
	
	export const lexValueExactNumber: LexFunction = combinatorChain(
		[matchValuePrefix, matchJsonNumber]
	);
	
	export const lexErrorIncompleteKey: LexFunction = combinatorIncomplete(
		matchString,
	);
	
	export const lexErrorIncompleteValue: LexFunction = combinatorOr([
		createMatchIncompleteExact(OperatorsSyntax.VALUE + "string"),
		createMatchIncompleteExact(OperatorsSyntax.VALUE + "number"),
		createMatchIncompleteExact(OperatorsSyntax.VALUE + "boolean"),
		createMatchIncompleteExact(OperatorsSyntax.VALUE + "null"),
		createMatchIncompleteExact(OperatorsSyntax.VALUE + "true"),
		createMatchIncompleteExact(OperatorsSyntax.VALUE + "false"),
		createMatchIncompleteExact(
			OperatorsSyntax.VALUE + OperatorsSyntax.L_BRACKET + OperatorsSyntax.R_BRACKET,
		),
		createMatchIncompleteExact(
			OperatorsSyntax.VALUE + OperatorsSyntax.L_BRACE + OperatorsSyntax.R_BRACE,
		),
		combinatorChain(
		 	[matchValuePrefix, combinatorIncomplete(matchString)],
		),
		combinatorChain(
			[matchValuePrefix, combinatorIncomplete(matchJsonNumber)],
		),
	]);
	
	export const lexErrorIncompleteArray: LexFunction = combinatorOr([
		createMatchIncompleteExact(
			OperatorsSyntax.L_BRACKET 
			+ OperatorsSyntax.WILDCARD 
			+ OperatorsSyntax.R_BRACKET
		),
		combinatorIncomplete(lexIndexArray),
	]);
	
	export const lexErrorIncompleteObject: LexFunction = combinatorOr([
		createMatchIncompleteExact(
			OperatorsSyntax.L_BRACE 
			+ OperatorsSyntax.WILDCARD 
			+ OperatorsSyntax.R_BRACE
		),
		combinatorIncomplete(lexIndexObject),
	]);
	
	/**
		Always the last lex function to be called.
		Runs forward looking until a whitespace or significant character is enocuntered.
		Always consumes at least 1 character and always matches.
	*/
	export function lexError(charList: Readonly<Array<string>>, start: number, end: number): [number, boolean] {
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