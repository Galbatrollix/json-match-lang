import * as lexer from "./../lex/lexer_main.ts"
import {type ParseError} from "./parser_errors.ts"
import {type ParseWarning} from "./parser_warnings.ts"


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

		if (lexer.enumUtils.isError(kind)){
			errorTokenIdx.push(i);
		}else if(isOverflownIndex(kind, str)){
			indexOverflowIdx.push(i);	
		}else if(isWrongString(kind, str)){
			wrongStringIdx.push(i);
		}
	}	

	return [];
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

/** s is assumed to be a decimal digit sequence with no leading zeros */
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
	return true;
}