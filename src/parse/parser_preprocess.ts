import * as lexer from "./../lex/lexer_a_index.ts"
import {type ParseError, ParseErrorKind} from "./parser_errors.ts"



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