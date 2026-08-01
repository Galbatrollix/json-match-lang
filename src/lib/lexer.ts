
/*
	All them types of tokens that lexing json path can possibly output.
	(...) means this is an example not the only possible value of the token
*/
const enum TokenKind {
	HEAD,      
	WHITESPACE,
	ERROR,

	OPERATOR_CHILD,                // > 
	OPERATOR_PARENT,               // <
	
	OPERATOR_SIBLING_NEXT,         // +
	OPERATOR_SIBLING_PREV,         // -
	OPERATOR_SIBLING_SUBSEQUENT,   // ++
	OPERATOR_SIBLING_PRECEDING,    // --
	OPERATOR_SIBLING_ANY,          // ~

	OPERATOR_OR,                   // |
	OPERATOR_AND,                  // &
	OPERATOR_NOT,                  // !
	
	// they match array indexes or object keys
	MATCH_KEY,                     // "dupa" (...)
	MATCH_KEY_NAKED,               // dupa   (...)
	MATCH_INDEX_ALL,               // 1234   (...)
	MATCH_INDEX_ARRAY,             // [1234] (...)
	MATCH_INDEX_OBJECT,            // {1234} (...)
	VALUE_WILDCARD_ALL,            // *
	VALUE_WILDCARD_ARRAY,          // [*]
	VALUE_WILDCARD_OBJECT,         // {*}
	
	// they match type of primitives
	PRIMITIVE_KIND_WILDCARD,       // #*
	PRIMITIVE_KIND_STRING,         // #string
	PRIMITIVE_KIND_NUMBER,         // #number
	PRIMITIVE_KIND_BOOLEAN,        // #boolean
	
	// they match exact values of primitives
	// use json parse to resolve primitives properly
	PRIMITIVE_NULL,                // #null
	PRIMITIVE_TRUE,                // #true
	PRIMITIVE_FALSE,               // #false
	PRIMITIVE_NUMBER,              // #124.2    (...)
	PRIMITIVE_STRING,              // #"duuupa" (...)
}


export type PathToken = {
	kind: TokenKind,
	endIdx: number,
};


export function tokenizeJsonPathString(path: string): Array<PathToken> {
	const characterList: Array<string> = Array.from(path);

	let charactersConsumed = 0;
	const charactersTotal = characterList.length;
	// initializing result array with a head element to simplyfy algorithm
	const result: Array<PathToken> = [{kind: TokenKind.HEAD, endIdx: 0}];
	
	while (charactersConsumed < charactersTotal) {
		const token: PathToken = nextToken(characterList, charactersConsumed);
		result.push(token);
		charactersConsumed = token.endIdx;	
	}	
	
	return result;
} 


const LexFunctionsCollection: Array<{fn: LexFunction, kind: TokenKind}> = [
	{fn: lexWhitespace,                 kind: TokenKind.WHITESPACE},
	{fn: lexOperatorChild,              kind: TokenKind.OPERATOR_CHILD},
	{fn: lexOperatorParent,             kind: TokenKind.OPERATOR_PARENT},

	{fn: lexOperatorSiblingNext,        kind: TokenKind.OPERATOR_SIBLING_NEXT},
	{fn: lexOperatorSiblingPrev,        kind: TokenKind.OPERATOR_SIBLING_PREV},
	{fn: lexOperatorSiblingSubsequent,  kind: TokenKind.OPERATOR_SIBLING_SUBSEQUENT},
	{fn: lexOperatorSiblingPreceding,   kind: TokenKind.OPERATOR_SIBLING_PRECEDING},
	{fn: lexOperatorSiblingAny,         kind: TokenKind.OPERATOR_SIBLING_ANY},

	{fn: lexOperatorOr,                 kind: TokenKind.OPERATOR_OR},
	{fn: lexOperatorAnd,                kind: TokenKind.OPERATOR_AND},
	{fn: lexOperatorNot,                kind: TokenKind.OPERATOR_NOT},

	{fn: lexValueWildcardAll,           kind: TokenKind.VALUE_WILDCARD_ALL},
	{fn: lexValueWildcardArray,         kind: TokenKind.VALUE_WILDCARD_ARRAY},
	{fn: lexValueWildcardObject,        kind: TokenKind.VALUE_WILDCARD_OBJECT},

	{fn: lexPrimitiveKindWildcard,      kind: TokenKind.PRIMITIVE_KIND_WILDCARD},
	{fn: lexPrimitiveKindString,        kind: TokenKind.PRIMITIVE_KIND_STRING},
	{fn: lexPrimitiveKindNumber,        kind: TokenKind.PRIMITIVE_KIND_NUMBER},
	{fn: lexPrimitiveKindBoolean,       kind: TokenKind.PRIMITIVE_KIND_BOOLEAN},

	{fn: lexPrimitiveNull,              kind: TokenKind.PRIMITIVE_NULL},
	{fn: lexPrimitiveTrue,              kind: TokenKind.PRIMITIVE_TRUE},
	{fn: lexPrimitiveFalse,             kind: TokenKind.PRIMITIVE_FALSE},

]



function nextToken(charList: Array<string>, current: number): PathToken {
	const remainingChars = charList.length - current;
	for (const {fn, kind} of LexFunctionsCollection) {
		const [consumed, success] = fn(charList, current, remainingChars);
		if (success){
			return {kind: kind, endIdx: current + consumed};
		}
	}
	
	// unreachable once functions are finished 	
	return {kind: TokenKind.ERROR, endIdx: current + 1};
	//throw new Error("Lexer encountered a fatal internal error");
	
}


// first return is count of consumed characters,
// second return is true if lex succeeded false otherwise
type LexFunction = (
	charList: Array<string>,
 	current: number,
	end: number
) => [number, boolean];

/*

	MAIN LEX FUNCTIONS

*/
function lexWhitespace(charList: Array<string>, current: number, end: number): [number, boolean] {
	
	return [1, true];
}

function lexOperatorChild(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact(">", charList, current, end);
}

function lexOperatorParent(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact("<", charList, current, end);
}

function lexOperatorSiblingNext(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact("+", charList, current, end);
}

function lexOperatorSiblingPrev(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact("-", charList, current, end);
}

function lexOperatorSiblingSubsequent(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact("++", charList, current, end);
}

function lexOperatorSiblingPreceding(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact("--", charList, current, end);
}

function lexOperatorSiblingAny(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact("~", charList, current, end);
}

function lexOperatorOr(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact("|", charList, current, end);
}

function lexOperatorAnd(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact("&", charList, current, end);
}

function lexOperatorNot(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact("!", charList, current, end);
}

function lexValueWildcardAll(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact("*", charList, current, end);
}

function lexValueWildcardArray(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact("[*]", charList, current, end);
}

function lexValueWildcardObject(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact("{*}", charList, current, end);
}

function lexPrimitiveKindWildcard(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact("#*", charList, current, end);
}

function lexPrimitiveKindString(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact("#string", charList, current, end);
}

function lexPrimitiveKindNumber(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact("#number", charList, current, end);
}

function lexPrimitiveKindBoolean(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact("#boolean", charList, current, end);
}

function lexPrimitiveNull(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact("#null", charList, current, end);
}

function lexPrimitiveTrue(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact("#true", charList, current, end);
}

function lexPrimitiveFalse(charList: Array<string>, current: number, end: number): [number, boolean] {
	return helperMatchExact("#false", charList, current, end);
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
function isDigit(c: string): boolean {
	return (c >= '0' && c <= '9');
}

/*
	This function tries to match longest string 
	containing only digits starting at current
*/
function helperDigitSequence(
	charList: Array<string>,
	current: number,
	end: number,
): [number, boolean] {
	let at = current;
	for (;at < end; at++) {
		const c = charList[at];	
		if (! isDigit(c)){
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