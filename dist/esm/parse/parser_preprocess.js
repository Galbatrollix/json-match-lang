import * as lexer from "./../lex/lexer_main.js";
import { ErrorKind } from "./parser_errors.js";
// import {type ParseWarning} from "./parser_warnings.ts"
/**
    A parser preprocessing function that scans token tape for critical problems
    with supplied tokens such as:
        - presence of error tokens
        - out of range index tokens
        - ill-formed strings (not json conformant)
    Returns an array of all errors that were found.
    If no error was found, empty array is returned.
*/
export function preprocessFindInvalidTokens(tape) {
    const errorTokenIdx = [];
    const indexOverflowIdx = [];
    const wrongStringIdx = [];
    for (let i = 0; i < tape.tokenCount; i++) {
        const kind = tape.tokenKind[i];
        const str = tape.tokenString[i];
        if (lexer.enumUtils.isError(kind)) {
            errorTokenIdx.push(i);
        }
        else if (isOverflownIndex(kind, str)) {
            indexOverflowIdx.push(i);
        }
        else if (isWrongString(kind, str)) {
            wrongStringIdx.push(i);
        }
    }
    const foundErrors = [];
    // some code repetition below, but making a generic mechanism 
    // for three 4-line blocks is more trouble than its worth 
    if (errorTokenIdx) {
        foundErrors.push({
            kind: ErrorKind.FOUND_ERROR_TOKENS,
            tokenIndexes: Object.freeze(errorTokenIdx),
        });
    }
    if (indexOverflowIdx) {
        foundErrors.push({
            kind: ErrorKind.INDEX_OUT_OF_BOUNDS,
            tokenIndexes: Object.freeze(indexOverflowIdx),
        });
    }
    if (wrongStringIdx) {
        foundErrors.push({
            kind: ErrorKind.STRING_NOT_VALID_JSON,
            tokenIndexes: Object.freeze(wrongStringIdx),
        });
    }
    return foundErrors;
}
/**
    Returns true if given token string and kind combination
    represents out of bounds index in expression (max index is u32max-1)
*/
function isOverflownIndex(tokenKind, tokenString) {
    switch (tokenKind) {
        case lexer.TokenKind.INDEX_ALL:
            return !fitsU32MinusOneAsNumber(tokenString);
        case lexer.TokenKind.INDEX_ARRAY:
        case lexer.TokenKind.INDEX_OBJECT:
            return !fitsU32MinusOneAsNumber(tokenString.slice(1, tokenString.length - 1));
        default:
            return false;
    }
}
/**
    Returns true if given token string and kind combination
    represents an invalid json string either as a key or as a string value.
*/
function isWrongString(tokenKind, tokenString) {
    switch (tokenKind) {
        case lexer.TokenKind.KEY_QUOTED:
            return !isValidJsonString(tokenString);
        case lexer.TokenKind.VALUE_EXACT_STRING:
            return !isValidJsonString(tokenString.slice(1));
        default:
            return false;
    }
}
/** s is assumed to be a decimal digit sequence with no leading zeros */
function fitsU32MinusOneAsNumber(s) {
    const u32Max = 4294967295;
    const breakpointDigits = 10;
    if (s.length < breakpointDigits) {
        return true;
    }
    else if (s.length > breakpointDigits) {
        return false;
    }
    else {
        return parseInt(s) < u32Max;
    }
}
function isValidJsonString(s) {
    try {
        JSON.parse(s);
        return true;
    }
    catch (e) {
        return false;
    }
}
