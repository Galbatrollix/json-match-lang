import { TokenKind } from "./lexer_enum.js";
import { funcs } from "./lexer_functions.js";
/**
    Takes json match string split into sequence of codepoints as an argument
    Returns a array of MatchTokens corresponding to the given sequence.
    Cannot fail, an exception or returning anything else than a (possibly empty)
    array means that there was a bug.

    Result is always at least 1 item long, as the function
    prepends a dummy element to the result.
    Dummy element is of kind WHITESPACE and its endIdx is always 0.
*/
export function lexJsonMatchCodepoints(characterList) {
    let charactersConsumed = 0;
    const charactersTotal = characterList.length;
    // initializing result array with a dummy whitespace element to simplify code 
    const result = [{ kind: TokenKind.WHITESPACE, endIdx: 0 }];
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
    { fn: funcs.lexWhitespace, kind: TokenKind.WHITESPACE },
    { fn: funcs.lexOperatorChild, kind: TokenKind.OPERATOR_CHILD },
    { fn: funcs.lexOperatorParent, kind: TokenKind.OPERATOR_PARENT },
    // must be before next and prev as they are superset of the latter
    { fn: funcs.lexOperatorSiblingSubsequent, kind: TokenKind.OPERATOR_SIBLING_SUBSEQUENT },
    { fn: funcs.lexOperatorSiblingPreceding, kind: TokenKind.OPERATOR_SIBLING_PRECEDING },
    { fn: funcs.lexOperatorSiblingNext, kind: TokenKind.OPERATOR_SIBLING_NEXT },
    { fn: funcs.lexOperatorSiblingPrev, kind: TokenKind.OPERATOR_SIBLING_PREV },
    { fn: funcs.lexOperatorSiblingAny, kind: TokenKind.OPERATOR_SIBLING_ANY },
    { fn: funcs.lexOperatorOr, kind: TokenKind.OPERATOR_OR },
    { fn: funcs.lexOperatorAnd, kind: TokenKind.OPERATOR_AND },
    { fn: funcs.lexOperatorNot, kind: TokenKind.OPERATOR_NOT },
    { fn: funcs.lexParenthesisLeft, kind: TokenKind.PARENTHESIS_LEFT },
    { fn: funcs.lexParenthesisRight, kind: TokenKind.PARENTHESIS_RIGHT },
    { fn: funcs.lexMatchKey, kind: TokenKind.MATCH_KEY },
    { fn: funcs.lexMatchKeyNaked, kind: TokenKind.MATCH_KEY_NAKED },
    { fn: funcs.lexMatchIndexAll, kind: TokenKind.MATCH_INDEX_ALL },
    { fn: funcs.lexMatchIndexArray, kind: TokenKind.MATCH_INDEX_ARRAY },
    { fn: funcs.lexMatchIndexObject, kind: TokenKind.MATCH_INDEX_OBJECT },
    { fn: funcs.lexMatchWildcardAll, kind: TokenKind.MATCH_WILDCARD_ALL },
    { fn: funcs.lexMatchWildcardArray, kind: TokenKind.MATCH_WILDCARD_ARRAY },
    { fn: funcs.lexMatchWildcardObject, kind: TokenKind.MATCH_WILDCARD_OBJECT },
    { fn: funcs.lexPrimitiveKindWildcard, kind: TokenKind.PRIMITIVE_KIND_WILDCARD },
    { fn: funcs.lexPrimitiveKindString, kind: TokenKind.PRIMITIVE_KIND_STRING },
    { fn: funcs.lexPrimitiveKindNumber, kind: TokenKind.PRIMITIVE_KIND_NUMBER },
    { fn: funcs.lexPrimitiveKindBoolean, kind: TokenKind.PRIMITIVE_KIND_BOOLEAN },
    { fn: funcs.lexPrimitiveNull, kind: TokenKind.PRIMITIVE_NULL },
    { fn: funcs.lexPrimitiveTrue, kind: TokenKind.PRIMITIVE_TRUE },
    { fn: funcs.lexPrimitiveFalse, kind: TokenKind.PRIMITIVE_FALSE },
    { fn: funcs.lexPrimitiveString, kind: TokenKind.PRIMITIVE_STRING },
    { fn: funcs.lexPrimitiveNumber, kind: TokenKind.PRIMITIVE_NUMBER },
    //must always be after their respective complete matches
    { fn: funcs.lexErrorIncompleteKey, kind: TokenKind.ERROR_INCOMPLETE_KEY },
    { fn: funcs.lexErrorIncompletePrimitive, kind: TokenKind.ERROR_INCOMPLETE_PRIMITIVE },
    //must always be last
    { fn: funcs.lexError, kind: TokenKind.ERROR },
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
*/
function mergeErrorTokensInPlace(tokens) {
    const end = tokens.length;
    let backPointer = 0;
    let previousWasError = false;
    for (let frontPointer = 0; frontPointer < end; frontPointer++) {
        const isErr = tokens[frontPointer].kind == TokenKind.ERROR;
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
