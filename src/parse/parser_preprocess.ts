import * as lexer from "./../lex/lexer_main.ts"
import {type ParseError, ParseErrorKind} from "./parser_errors.ts"
import {type ParseWarning, ParseWarningKind} from "./parser_warnings.ts"


/**
	A parser preprocessing function that scans token tape for critical problems
	with supplied tokens such as:
		- presence of error tokens
		- out of range index tokens
		- ill-formed strings (not json conformant)
	Returns an array of all errors that were found. 
	If no error was found, empty array is returned.
*/
export function preprocessFindInvalidTokens(tape: lexer.TokenTape): Array<ParseError> {
	const errorTokenIdx: Array<number> = [];
	const indexOverflowIdx: Array<number> = [];
	const wrongStringIdx: Array<number> = [];
	
	for(let i = 0; i < tape.tokenCount; i++){
		const kind: lexer.TokenKind = tape.tokenKind[i];
		const str: string = tape.tokenString[i];

		if (lexer.TokenKindUtils.isError(kind)){
			errorTokenIdx.push(i);
		}else if(isOverflownIndex(kind, str)){
			indexOverflowIdx.push(i);	
		}else if(isWrongString(kind, str)){
			wrongStringIdx.push(i);
		}
	}	

	const foundErrors: Array<ParseError> = [];
	
	// some code repetition below, but making a generic mechanism 
	// for three 4-line blocks is more trouble than its worth 
	if (errorTokenIdx.length){
		foundErrors.push({
			kind: ParseErrorKind.FOUND_ERROR_TOKENS,
			tokenIndexes: Object.freeze(errorTokenIdx),
		});
	}

	if (indexOverflowIdx.length){
		foundErrors.push({
			kind: ParseErrorKind.INDEX_OUT_OF_BOUNDS,
			tokenIndexes: Object.freeze(indexOverflowIdx),
		});
	}

	if (wrongStringIdx.length){
		foundErrors.push({
			kind: ParseErrorKind.STRING_NOT_VALID_JSON,
			tokenIndexes: Object.freeze(wrongStringIdx),
		});
	}
	return foundErrors;
}

/**
	Parser preprocessing function that based on lexer.TokenTape 
	makes a new array of tokens with whitespace filtered.

	Returns new array with whitespace filtered and mapping
	that maps indexes in filtered array to indexes in original TokenTape.
*/
export function preprocessFilterWhitespace( 
	tape: lexer.TokenTape 
):{ tokens: Array<lexer.TokenKind>, mapping: Array<number>} {
	
	// preallocating arrays 
	const tokens: Array<lexer.TokenKind> = new Array(tape.tokenCount);
	const mapping: Array<number> = new Array(tape.tokenCount);

	let filteredIndex = 0;
		
	for(let i = 0; i < tape.tokenCount; i++){
		const kind = tape.tokenKind[i];
		if (kind == lexer.TokenKind.WHITESPACE){
			continue;
		}
		
		tokens[filteredIndex] = kind;
		mapping[filteredIndex] = i;

		filteredIndex += 1;
	}

	tokens.length = mapping.length = filteredIndex;
	
	return {tokens, mapping}
}


/**
	A parser preprocessing function that scans token tape for suspicious
	sequences that couldn't possibly be output by the lexer unless something broke.

	Bogus sequences are not syntactically invalid from parser's perspective, so
	parser can continue normal operation if they are found - hence warning instead of 
	an error.
	
	If at least one pair of ajacent tokens that qualify as bogus sequence is found,
	this function returns a single-element ParseWarning array holding an appropriate
	warning value. Otherwise an empty array is returned.
*/
export function preprocessFindBogusPairs(tape: lexer.TokenTape): Array<ParseWarning> {
	const bogusPairIndexes: Array<number> = [];
	
	for(let i = 1; i < tape.tokenCount; i++){
		const leftKind = tape.tokenKind[i-1];
		const rightKind = tape.tokenKind[i];
		
		if (isBogusPair(leftKind, rightKind)){
			bogusPairIndexes.push(i-1);
		}
	}
	
	if (bogusPairIndexes.length){
		return [{
			kind: ParseWarningKind.BOGUS_PAIR,
			tokenIndexes: Object.freeze(bogusPairIndexes), 
		}];
	}else{
		return [];
	}
}

type leftBogusOptions = 
	| lexer.TokenKind.KEY_NAKED
	| lexer.TokenKind.WHITESPACE
	| lexer.TokenKind.INDEX_ALL
	| lexer.TokenKind.VALUE_EXACT_NUMBER
	| lexer.TokenKind.OPERATOR_SIBLING_NEXT
	| lexer.TokenKind.OPERATOR_SIBLING_PREV;
/**
	Collection of bogus options. If left member of a pair
	is a key in this collection, pair is bogus if and only if
	right member of a pair is contained in bogusPairsVariants[leftMember]
*/
const bogusPairsVariants: Record<leftBogusOptions, Array<lexer.TokenKind>> = {
	[lexer.TokenKind.KEY_NAKED]:           [lexer.TokenKind.KEY_NAKED],
	[lexer.TokenKind.WHITESPACE]:          [lexer.TokenKind.WHITESPACE],
	[lexer.TokenKind.INDEX_ALL]:           [lexer.TokenKind.INDEX_ALL],
	[lexer.TokenKind.VALUE_EXACT_NUMBER]:  [lexer.TokenKind.INDEX_ALL],

	[lexer.TokenKind.OPERATOR_SIBLING_NEXT]:  [
		lexer.TokenKind.OPERATOR_SIBLING_NEXT,
		lexer.TokenKind.OPERATOR_SIBLING_SUBSEQUENT,
	],
	[lexer.TokenKind.OPERATOR_SIBLING_PREV]:  [
		lexer.TokenKind.OPERATOR_SIBLING_PREV,
		lexer.TokenKind.OPERATOR_SIBLING_PRECEDING,
	],
}


/**
	Checks if two adjacent token Kinds qualify as a "bogus pair"
*/
function isBogusPair(leftKind: lexer.TokenKind, rightKind: lexer.TokenKind): boolean {
	switch (leftKind){
		default:
			return false;
		case lexer.TokenKind.KEY_NAKED:
		case lexer.TokenKind.WHITESPACE:
		case lexer.TokenKind.INDEX_ALL:
		case lexer.TokenKind.VALUE_EXACT_NUMBER:
		case lexer.TokenKind.OPERATOR_SIBLING_NEXT:
		case lexer.TokenKind.OPERATOR_SIBLING_NEXT:
			return bogusPairsVariants[leftKind].includes(rightKind);
	}	
}


/**
	Returns true if given token string and kind combination
	represents out of bounds index in expression (max index is u32max-1)
*/
function isOverflownIndex(tokenKind: lexer.TokenKind, tokenString: string): boolean {
	switch (tokenKind){
		case lexer.TokenKind.INDEX_ALL:
			return ! fitsU32MinusOneAsNumber(tokenString);
		case lexer.TokenKind.INDEX_ARRAY:
		case lexer.TokenKind.INDEX_OBJECT:		
			return ! fitsU32MinusOneAsNumber(tokenString.slice(1, tokenString.length -1));
		default:
			return false;	
	}
}

/**
	Returns true if given token string and kind combination
	represents an invalid json string either as a key or as a string value.
*/
function isWrongString(tokenKind: lexer.TokenKind, tokenString: string): boolean {
	switch (tokenKind){
		case lexer.TokenKind.KEY_QUOTED:
			return ! isValidJsonString(tokenString);
		case lexer.TokenKind.VALUE_EXACT_STRING:
			return ! isValidJsonString(tokenString.slice(1));
		default:
			return false;
	}
}

/** 
	s is assumed to be a decimal digit sequence with no leading zeros 
	just as token index is defined by the lexer
*/
function fitsU32MinusOneAsNumber(s: string): boolean {
	const u32Max = 4294967295;
	const breakpointDigits = 10;

	if (s.length < breakpointDigits){
		return true;
	}else if (s.length > breakpointDigits){
		return false;
	}else{
		return parseInt(s) < u32Max;
	}
	
}

function isValidJsonString(s: string): boolean {
	try{
		JSON.parse(s);
		return true;
	}catch(e){
		return false;
	}

}