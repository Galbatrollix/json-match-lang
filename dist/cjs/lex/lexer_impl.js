"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lexJsonMatchCodepoints = lexJsonMatchCodepoints;
const lexer_enum_ts_1 = require("./lexer_enum.js");
const lexer_functions_ts_1 = require("./lexer_functions.js");
/**
    Takes json match string split into sequence of codepoints as an argument
    Returns a array of MatchTokens corresponding to the given sequence.
    Cannot fail, an exception or returning anything else than a (possibly empty)
    array means that there was a bug.

    Result is always at least 1 item long, as the function
    prepends a dummy element to the result.
    Dummy element is of kind WHITESPACE and its endIdx is always 0.
*/
function lexJsonMatchCodepoints(characterList) {
    let charactersConsumed = 0;
    const charactersTotal = characterList.length;
    // initializing result array with a dummy whitespace element to simplify code 
    const result = [{ kind: lexer_enum_ts_1.TokenKind.WHITESPACE, endIdx: 0 }];
    while (charactersConsumed < charactersTotal) {
        const token = nextToken(characterList, charactersConsumed);
        result.push(token);
        charactersConsumed = token.endIdx;
    }
    mergeErrorTokensInPlace(result);
    return result;
}
/**
    Collection of lexer functions and their assigned token kind values.
    If a function matches, resulting token is given assigned tokenKind.
    
    Warning: ordering of these functions matters greatly, error must be the last
    , partials must be at least after the full matches and so on (...)
*/
const LexFunctionsCollection = [
    { fn: lexer_functions_ts_1.funcs.lexWhitespace, kind: lexer_enum_ts_1.TokenKind.WHITESPACE },
    { fn: lexer_functions_ts_1.funcs.lexOperatorChild, kind: lexer_enum_ts_1.TokenKind.OPERATOR_CHILD },
    { fn: lexer_functions_ts_1.funcs.lexOperatorParent, kind: lexer_enum_ts_1.TokenKind.OPERATOR_PARENT },
    // must be before next and prev as they are superset of the latter
    { fn: lexer_functions_ts_1.funcs.lexOperatorSiblingSubsequent, kind: lexer_enum_ts_1.TokenKind.OPERATOR_SIBLING_SUBSEQUENT },
    { fn: lexer_functions_ts_1.funcs.lexOperatorSiblingPreceding, kind: lexer_enum_ts_1.TokenKind.OPERATOR_SIBLING_PRECEDING },
    { fn: lexer_functions_ts_1.funcs.lexOperatorSiblingNext, kind: lexer_enum_ts_1.TokenKind.OPERATOR_SIBLING_NEXT },
    { fn: lexer_functions_ts_1.funcs.lexOperatorSiblingPrev, kind: lexer_enum_ts_1.TokenKind.OPERATOR_SIBLING_PREV },
    { fn: lexer_functions_ts_1.funcs.lexOperatorSiblingAny, kind: lexer_enum_ts_1.TokenKind.OPERATOR_SIBLING_ANY },
    { fn: lexer_functions_ts_1.funcs.lexOperatorOr, kind: lexer_enum_ts_1.TokenKind.OPERATOR_OR },
    { fn: lexer_functions_ts_1.funcs.lexOperatorAnd, kind: lexer_enum_ts_1.TokenKind.OPERATOR_AND },
    { fn: lexer_functions_ts_1.funcs.lexOperatorNot, kind: lexer_enum_ts_1.TokenKind.OPERATOR_NOT },
    { fn: lexer_functions_ts_1.funcs.lexParenthesisLeft, kind: lexer_enum_ts_1.TokenKind.PARENTHESIS_LEFT },
    { fn: lexer_functions_ts_1.funcs.lexParenthesisRight, kind: lexer_enum_ts_1.TokenKind.PARENTHESIS_RIGHT },
    { fn: lexer_functions_ts_1.funcs.lexKeyQuoted, kind: lexer_enum_ts_1.TokenKind.KEY_QUOTED },
    { fn: lexer_functions_ts_1.funcs.lexKeyNaked, kind: lexer_enum_ts_1.TokenKind.KEY_NAKED },
    { fn: lexer_functions_ts_1.funcs.lexIndexAll, kind: lexer_enum_ts_1.TokenKind.INDEX_ALL },
    { fn: lexer_functions_ts_1.funcs.lexIndexArray, kind: lexer_enum_ts_1.TokenKind.INDEX_ARRAY },
    { fn: lexer_functions_ts_1.funcs.lexIndexObject, kind: lexer_enum_ts_1.TokenKind.INDEX_OBJECT },
    { fn: lexer_functions_ts_1.funcs.lexWildcardAll, kind: lexer_enum_ts_1.TokenKind.WILDCARD_ALL },
    { fn: lexer_functions_ts_1.funcs.lexWildcardArray, kind: lexer_enum_ts_1.TokenKind.WILDCARD_ARRAY },
    { fn: lexer_functions_ts_1.funcs.lexWildcardObject, kind: lexer_enum_ts_1.TokenKind.WILDCARD_OBJECT },
    { fn: lexer_functions_ts_1.funcs.lexValueTypeWildcard, kind: lexer_enum_ts_1.TokenKind.VALUE_TYPE_WILDCARD },
    { fn: lexer_functions_ts_1.funcs.lexValueTypeString, kind: lexer_enum_ts_1.TokenKind.VALUE_TYPE_STRING },
    { fn: lexer_functions_ts_1.funcs.lexValueTypeNumber, kind: lexer_enum_ts_1.TokenKind.VALUE_TYPE_NUMBER },
    { fn: lexer_functions_ts_1.funcs.lexValueTypeBoolean, kind: lexer_enum_ts_1.TokenKind.VALUE_TYPE_BOOLEAN },
    { fn: lexer_functions_ts_1.funcs.lexValueExactNull, kind: lexer_enum_ts_1.TokenKind.VALUE_EXACT_NULL },
    { fn: lexer_functions_ts_1.funcs.lexValueExactTrue, kind: lexer_enum_ts_1.TokenKind.VALUE_EXACT_TRUE },
    { fn: lexer_functions_ts_1.funcs.lexValueExactFalse, kind: lexer_enum_ts_1.TokenKind.VALUE_EXACT_FALSE },
    { fn: lexer_functions_ts_1.funcs.lexValueExactString, kind: lexer_enum_ts_1.TokenKind.VALUE_EXACT_STRING },
    { fn: lexer_functions_ts_1.funcs.lexValueExactNumber, kind: lexer_enum_ts_1.TokenKind.VALUE_EXACT_NUMBER },
    //must always be after their respective complete matches
    { fn: lexer_functions_ts_1.funcs.lexErrorIncompleteKey, kind: lexer_enum_ts_1.TokenKind.ERROR_INCOMPLETE_KEY },
    { fn: lexer_functions_ts_1.funcs.lexErrorIncompleteValue, kind: lexer_enum_ts_1.TokenKind.ERROR_INCOMPLETE_VALUE },
    { fn: lexer_functions_ts_1.funcs.lexErrorIncompleteArray, kind: lexer_enum_ts_1.TokenKind.ERROR_INCOMPLETE_ARRAY },
    { fn: lexer_functions_ts_1.funcs.lexErrorIncompleteObject, kind: lexer_enum_ts_1.TokenKind.ERROR_INCOMPLETE_OBJECT },
    //must always be last
    { fn: lexer_functions_ts_1.funcs.lexError, kind: lexer_enum_ts_1.TokenKind.ERROR },
];
/**
    Uses lex functions collection to match next token, starting from
    given "current" position in charList. Sequentially traverses
    lex functions from lowest to highest index and returns results and
    assigned token kind of the first function that matched.

    At least one of the functions must match (error token).
    If that doesnt happen, error gets thrown.
*/
function nextToken(charList, current) {
    const end = charList.length;
    for (const { fn, kind } of LexFunctionsCollection) {
        const [consumed, success] = fn(charList, current, end);
        if (success) {
            return { kind: kind, endIdx: current + consumed };
        }
    }
    // unreachable once functions are finished 	
    throw new Error("Lexer encountered a fatal internal error." +
        " End of nextToken function reached");
}
/*
    Function performing postprocessing of token stream.
    Merges consecutive error tokens in the array of MatchTokens.
    sequence:
        (dummy)/ERROR/ERROR/T1/T2/ERROR/T3/ERROR/ERROR
    transforms to:
        (dummy)/ERROR/T1/T2/ERROR/T3/ERROR/
    Operates only on plain error tokens - disregards errors-incomplete tokens.
*/
function mergeErrorTokensInPlace(tokens) {
    const end = tokens.length;
    let backPointer = 0;
    let previousWasError = false;
    for (let frontPointer = 0; frontPointer < end; frontPointer++) {
        const isErr = tokens[frontPointer].kind == lexer_enum_ts_1.TokenKind.ERROR;
        if (!isErr) {
            tokens[backPointer] = tokens[frontPointer];
            backPointer += 1;
            previousWasError = false;
            continue;
        }
        // is Error
        if (!previousWasError) {
            tokens[backPointer] = tokens[frontPointer];
            backPointer += 1;
        }
        else {
            tokens[backPointer - 1] = tokens[frontPointer];
        }
        previousWasError = true;
    }
    tokens.length = backPointer;
}
