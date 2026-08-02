import { TokenKind } from "./lexer_enum.js";
export function lexJsonPathString(characterList) {
    let charactersConsumed = 0;
    const charactersTotal = characterList.length;
    // initializing result array with a dummy error element to simplify code 
    const result = [{ kind: TokenKind.ERROR, endIdx: 0 }];
    while (charactersConsumed < charactersTotal) {
        const token = nextToken(characterList, charactersConsumed);
        result.push(token);
        charactersConsumed = token.endIdx;
    }
    mergeErrorTokensInPlace(result);
    return result;
}
/*
    Merges consecutive error tokens in the array of pathtokens.
    Modifies input in place, leaves 1st dummy element unmodified.
    
    sequence:
        ERROR(dummy)/ERROR/ERROR/T1/T2/ERROR/T3/ERROR/ERROR
    transforms to:
        ERROR(dummy)/ERROR/T1/T2/ERROR/T3/ERROR/
*/
function mergeErrorTokensInPlace(tokens) {
    if (tokens.length == 1) {
        return;
    }
    const end = tokens.length;
    let backPointer = 1;
    let accumulatorActive = tokens[1].kind == TokenKind.ERROR;
    for (let frontPointer = 1; frontPointer < end; frontPointer++) {
        const isErr = tokens[frontPointer].kind == TokenKind.ERROR;
        // if encountered normal element, move back pointer forward
        // and overwrite back pointer value with front pointer value
        if (!isErr) {
            backPointer += 1;
            tokens[backPointer] = tokens[frontPointer];
            accumulatorActive = false;
            continue;
        }
        // (isErr == true)
        // if accumulating error tokens, just overwrite back position with front
        // if not accumulating errors yet, move back pointer and enable accumulation
        if (!accumulatorActive) {
            backPointer += 1;
            tokens[backPointer] = tokens[frontPointer];
            accumulatorActive = true;
        }
        else {
            tokens[backPointer] = tokens[frontPointer];
        }
    }
    //shortening resulting array to remove excess elements
    tokens.length = backPointer + 1;
}
const LexFunctionsCollection = [
    { fn: lexWhitespace, kind: TokenKind.WHITESPACE },
    { fn: lexOperatorChild, kind: TokenKind.OPERATOR_CHILD },
    { fn: lexOperatorParent, kind: TokenKind.OPERATOR_PARENT },
    // must be before next and prev as they are superset of the latter
    { fn: lexOperatorSiblingSubsequent, kind: TokenKind.OPERATOR_SIBLING_SUBSEQUENT },
    { fn: lexOperatorSiblingPreceding, kind: TokenKind.OPERATOR_SIBLING_PRECEDING },
    { fn: lexOperatorSiblingNext, kind: TokenKind.OPERATOR_SIBLING_NEXT },
    { fn: lexOperatorSiblingPrev, kind: TokenKind.OPERATOR_SIBLING_PREV },
    { fn: lexOperatorSiblingAny, kind: TokenKind.OPERATOR_SIBLING_ANY },
    { fn: lexOperatorOr, kind: TokenKind.OPERATOR_OR },
    { fn: lexOperatorAnd, kind: TokenKind.OPERATOR_AND },
    { fn: lexOperatorNot, kind: TokenKind.OPERATOR_NOT },
    { fn: lexMatchKey, kind: TokenKind.MATCH_KEY },
    { fn: lexMatchKeyNaked, kind: TokenKind.MATCH_KEY_NAKED },
    { fn: lexMatchIndexAll, kind: TokenKind.MATCH_INDEX_ALL },
    { fn: lexMatchIndexArray, kind: TokenKind.MATCH_INDEX_ARRAY },
    { fn: lexMatchIndexObject, kind: TokenKind.MATCH_INDEX_OBJECT },
    { fn: lexMatchWildcardAll, kind: TokenKind.MATCH_WILDCARD_ALL },
    { fn: lexMatchWildcardArray, kind: TokenKind.MATCH_WILDCARD_ARRAY },
    { fn: lexMatchWildcardObject, kind: TokenKind.MATCH_WILDCARD_OBJECT },
    { fn: lexPrimitiveKindWildcard, kind: TokenKind.PRIMITIVE_KIND_WILDCARD },
    { fn: lexPrimitiveKindString, kind: TokenKind.PRIMITIVE_KIND_STRING },
    { fn: lexPrimitiveKindNumber, kind: TokenKind.PRIMITIVE_KIND_NUMBER },
    { fn: lexPrimitiveKindBoolean, kind: TokenKind.PRIMITIVE_KIND_BOOLEAN },
    { fn: lexPrimitiveNull, kind: TokenKind.PRIMITIVE_NULL },
    { fn: lexPrimitiveTrue, kind: TokenKind.PRIMITIVE_TRUE },
    { fn: lexPrimitiveFalse, kind: TokenKind.PRIMITIVE_FALSE },
    { fn: lexPrimitiveString, kind: TokenKind.PRIMITIVE_STRING },
    { fn: lexPrimitiveNumber, kind: TokenKind.PRIMITIVE_NUMBER },
    //must always be last
    { fn: lexError, kind: TokenKind.ERROR },
];
const OperatorsSyntax = {
    CHILD: ">",
    PARENT: "<",
    SIBLING_NEXT: "+",
    SIBLING_PREV: "-",
    SIBLING_SUBSEQUENT: "++",
    SIBLING_PRECEDING: "--",
    SIBLING_ANY: "~",
    OR: "|",
    AND: "&",
    NOT: "!",
    // not operators but have special syntax so
    L_BRACKET: "[",
    R_BRACKET: "]",
    L_BRACE: "{",
    R_BRACE: "}",
    WILDCARD: "*",
    PRIMITIVE: "#",
    STRING: `"`,
};
function nextToken(charList, current) {
    const end = charList.length;
    for (const { fn, kind } of LexFunctionsCollection) {
        const [consumed, success] = fn(charList, current, end);
        if (success) {
            return { kind: kind, endIdx: current + consumed };
        }
    }
    // unreachable once functions are finished 	
    // return {kind: TokenKind.ERROR, endIdx: current + 1};
    throw new Error("Lexer encountered a fatal internal error");
}
/*

    MAIN LEX FUNCTIONS

*/
function lexOperatorChild(charList, current, end) {
    return helperMatchExact(OperatorsSyntax.CHILD, charList, current, end);
}
function lexOperatorParent(charList, current, end) {
    return helperMatchExact(OperatorsSyntax.PARENT, charList, current, end);
}
function lexOperatorSiblingNext(charList, current, end) {
    return helperMatchExact(OperatorsSyntax.SIBLING_NEXT, charList, current, end);
}
function lexOperatorSiblingPrev(charList, current, end) {
    return helperMatchExact(OperatorsSyntax.SIBLING_PREV, charList, current, end);
}
function lexOperatorSiblingSubsequent(charList, current, end) {
    return helperMatchExact(OperatorsSyntax.SIBLING_SUBSEQUENT, charList, current, end);
}
function lexOperatorSiblingPreceding(charList, current, end) {
    return helperMatchExact(OperatorsSyntax.SIBLING_PRECEDING, charList, current, end);
}
function lexOperatorSiblingAny(charList, current, end) {
    return helperMatchExact(OperatorsSyntax.SIBLING_ANY, charList, current, end);
}
function lexOperatorOr(charList, current, end) {
    return helperMatchExact(OperatorsSyntax.OR, charList, current, end);
}
function lexOperatorAnd(charList, current, end) {
    return helperMatchExact(OperatorsSyntax.AND, charList, current, end);
}
function lexOperatorNot(charList, current, end) {
    return helperMatchExact(OperatorsSyntax.NOT, charList, current, end);
}
function lexMatchWildcardAll(charList, current, end) {
    return helperMatchExact(OperatorsSyntax.WILDCARD, charList, current, end);
}
const patternWildcardArray = OperatorsSyntax.L_BRACKET + OperatorsSyntax.WILDCARD + OperatorsSyntax.R_BRACKET;
function lexMatchWildcardArray(charList, current, end) {
    return helperMatchExact(patternWildcardArray, charList, current, end);
}
const patternWildcardObject = OperatorsSyntax.L_BRACE + OperatorsSyntax.WILDCARD + OperatorsSyntax.R_BRACE;
function lexMatchWildcardObject(charList, current, end) {
    return helperMatchExact(patternWildcardObject, charList, current, end);
}
const patternPrimitiveKindWildcard = OperatorsSyntax.PRIMITIVE + OperatorsSyntax.WILDCARD;
function lexPrimitiveKindWildcard(charList, current, end) {
    return helperMatchExact(patternPrimitiveKindWildcard, charList, current, end);
}
function lexPrimitiveKindString(charList, current, end) {
    return helperMatchExact(OperatorsSyntax.PRIMITIVE + "string", charList, current, end);
}
function lexPrimitiveKindNumber(charList, current, end) {
    return helperMatchExact(OperatorsSyntax.PRIMITIVE + "number", charList, current, end);
}
function lexPrimitiveKindBoolean(charList, current, end) {
    return helperMatchExact(OperatorsSyntax.PRIMITIVE + "boolean", charList, current, end);
}
function lexPrimitiveNull(charList, current, end) {
    return helperMatchExact(OperatorsSyntax.PRIMITIVE + "null", charList, current, end);
}
function lexPrimitiveTrue(charList, current, end) {
    return helperMatchExact(OperatorsSyntax.PRIMITIVE + "true", charList, current, end);
}
function lexPrimitiveFalse(charList, current, end) {
    return helperMatchExact(OperatorsSyntax.PRIMITIVE + "false", charList, current, end);
}
function lexWhitespace(charList, current, end) {
    return helperTestMatchSequence(isWhitespaceChar, charList, current, end);
}
function lexMatchKeyNaked(charList, current, end) {
    return helperTestMatchSequence(isAsciiLetterChar, charList, current, end);
}
function lexMatchIndexAll(charList, current, end) {
    return helperMatchInteger(charList, current, end);
}
function lexMatchIndexArray(charList, current, end) {
    const matchOpenBracket = function (charList, current, end) {
        return helperMatchExact(OperatorsSyntax.L_BRACKET, charList, current, end);
    };
    const matchClosedBracket = function (charList, current, end) {
        return helperMatchExact(OperatorsSyntax.R_BRACKET, charList, current, end);
    };
    return combinatorChain([
        matchOpenBracket, helperMatchInteger, matchClosedBracket
    ])(charList, current, end);
}
function lexMatchIndexObject(charList, current, end) {
    const matchOpenBracket = function (charList, current, end) {
        return helperMatchExact(OperatorsSyntax.L_BRACE, charList, current, end);
    };
    const matchClosedBracket = function (charList, current, end) {
        return helperMatchExact(OperatorsSyntax.R_BRACE, charList, current, end);
    };
    return combinatorChain([
        matchOpenBracket, helperMatchInteger, matchClosedBracket
    ])(charList, current, end);
}
function lexMatchKey(charList, current, end) {
    return helperMatchString(charList, current, end);
}
function lexPrimitiveString(charList, current, end) {
    const matchHash = function (charList, current, end) {
        return helperMatchExact(OperatorsSyntax.PRIMITIVE, charList, current, end);
    };
    return combinatorChain([matchHash, helperMatchString])(charList, current, end);
}
/*
    https://www.poppastring.com/blog/json-numbers-changed-with-leading-zeros
    
    Json number has 3 sections:
    1: string of digits with no leading zeros and possible minus in front.
    2: possibly: (a dot followed by string of digits)
    3: possibly: e or E followed by possible minus/plus and strings of digits
*/
function lexPrimitiveNumber(charList, current, end) {
    const matchHash = function (charList, current, end) {
        return helperMatchExact("#", charList, current, end);
    };
    const matchMinus = function (charList, current, end) {
        return helperMatchExact("-", charList, current, end);
    };
    const matchPlus = function (charList, current, end) {
        return helperMatchExact("+", charList, current, end);
    };
    const matchDot = function (charList, current, end) {
        return helperMatchExact(".", charList, current, end);
    };
    const matchLowecaseE = function (charList, current, end) {
        return helperMatchExact("e", charList, current, end);
    };
    const matchUppercaseE = function (charList, current, end) {
        return helperMatchExact("E", charList, current, end);
    };
    const matchDigitString = function (charList, current, end) {
        return helperTestMatchSequence(isDigitChar, charList, current, end);
    };
    const matchPlusOrMinus = combinatorOr([matchPlus, matchMinus]);
    const matchAnyE = combinatorOr([matchLowecaseE, matchUppercaseE]);
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
function lexError(charList, current, end) {
    const [consumed, matched] = helperTestMatchSequence(isNonWhitespaceNonOperatorChar, charList, current + 1, end);
    if (!matched) {
        return [1, true];
    }
    else {
        return [consumed + 1, true];
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
function helperMatchExact(pat, charList, current, end) {
    const remaining = end - current;
    if (remaining < pat.length) {
        return [0, false];
    }
    let at = current;
    for (const c of pat) {
        if (c != charList[at]) {
            return [0, false];
        }
        at += 1;
    }
    return [at - current, true];
}
// only for single characters 
function isDigitChar(c) {
    return (c >= '0' && c <= '9');
}
// only for single characters
function isWhitespaceChar(c) {
    return " \f\n\r\t\v\u00A0\u2028\u2029".includes(c);
}
// only for single characters
function isAsciiLetterChar(c) {
    const code = c.charCodeAt(0);
    return (code >= 65 && code <= 90 || code >= 97 && code <= 122);
}
const allOperators = Object.values(OperatorsSyntax);
const allOperatorsJoined = allOperators.join("");
// only for single characters
function isOperatorChar(c) {
    return allOperatorsJoined.includes(c);
}
function isNonWhitespaceNonOperatorChar(c) {
    return !isOperatorChar(c) && !isWhitespaceChar(c);
}
/*
    This function tries to match longest string
    containing only characters that pass the test
    provided via test function parameter.
*/
function helperTestMatchSequence(test, charList, current, end) {
    let at = current;
    for (; at < end; at++) {
        const c = charList[at];
        if (!test(c)) {
            break;
        }
    }
    const consumed = at - current;
    if (consumed) {
        return [consumed, true];
    }
    else {
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
function helperNoLeadingZeroes(charList, current, end) {
    const first = charList[current];
    if (first != '0') {
        return true;
    }
    // first is zero
    if (end - current == 1) {
        return true;
    }
    return false;
}
/*
    Matches sequence of consecutive digits if it has no leading zeros.
    A single zero will match if followed by non-digit character.
*/
function helperMatchInteger(charList, current, end) {
    const [consumed, success] = helperTestMatchSequence(isDigitChar, charList, current, end);
    if (!success) {
        return [0, false];
    }
    const leadingZerosOk = helperNoLeadingZeroes(charList, current, current + consumed);
    if (leadingZerosOk) {
        return [consumed, true];
    }
    else {
        return [0, false];
    }
}
/*
    Will match an arbitrary string starting and ending with " character
    Handles backslash escapes in manner compatible with json
*/
function helperMatchString(charList, current, end) {
    // must at least have room for 2 " characters
    const remaining = end - current;
    if (remaining < 2) {
        return [0, false];
    }
    // must start with a " character.
    if (charList[current] != '"') {
        return [0, false];
    }
    //moving pointer past first doublequote
    let at = current + 1;
    let precedingBackslashes = 0;
    for (; at < end; at++) {
        const c = charList[at];
        let escaped = precedingBackslashes % 2 == 1;
        if (c == '"' && !escaped) {
            const consumed = at - current + 1;
            return [consumed, true];
        }
        if (c == '\\') {
            precedingBackslashes += 1;
        }
        else {
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
function combinatorChain(lexerList) {
    const resultFunc = function (charList, current, end) {
        let fnIndex = 0;
        const fnCount = lexerList.length;
        let at = current;
        while (at < end && fnIndex < fnCount) {
            const [consumed, matched] = lexerList[fnIndex](charList, at, end);
            if (!matched) {
                return [0, false];
            }
            at += consumed;
            fnIndex += 1;
        }
        const consumed = at - current;
        const allFunctionsPassed = (fnIndex == fnCount);
        if (allFunctionsPassed) {
            return [consumed, true];
        }
        else {
            return [0, false];
        }
    };
    return resultFunc;
}
/*
    Parser combinator that tranforms an array of lex functions into a single lex
    function that matches if at least one of the given functions matches.

    If multiple functions match , then:
    resulting lex function will match the one encountered first

*/
function combinatorOr(lexerList) {
    const resultFunc = function (charList, current, end) {
        for (const fn of lexerList) {
            const [consumed, matched] = fn(charList, current, end);
            if (matched) {
                return [consumed, true];
            }
        }
        // not a single one matched
        return [0, false];
    };
    return resultFunc;
}
/*
    Parse combinator that tranforms a single lex function into a new one.
    Returned function passes with identical results if provided function passes.
    If provided function fails, returned function passes with 0 characters consumed.
*/
function combinatorOptional(lexerFunc) {
    const resultFunc = function (charList, current, end) {
        const [consumed, matched] = lexerFunc(charList, current, end);
        if (matched) {
            return [consumed, matched];
        }
        else {
            return [0, true];
        }
    };
    return resultFunc;
}
