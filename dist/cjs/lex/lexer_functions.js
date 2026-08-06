"use strict";
/**
    Exported namespace "funcs" with lex functions is at the end of the file.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.funcs = void 0;
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
    // are used to stop error token lex function
    // and construct some lexer functions
    L_BRACKET: "[",
    R_BRACKET: "]",
    L_BRACE: "{",
    R_BRACE: "}",
    WILDCARD: "*",
    PRIMITIVE: "#",
    STRING: `"`,
};
/**
    Produces a lex function that will either exactly
    match pattern string by consuming pattern.length characters
    or will fail and return [0, false]
*/
function createMatchExact(pattern) {
    const patternCodepoints = Array.from(pattern);
    const resultFunc = function (charList, start, end) {
        const remaining = end - start;
        // cannot possibly match if there is not enough available characters
        if (remaining < patternCodepoints.length) {
            return [0, false];
        }
        for (let i = 0; i < patternCodepoints.length; i++) {
            const at = i + start;
            if (patternCodepoints[i] != charList[at]) {
                return [0, false];
            }
        }
        return [patternCodepoints.length, true];
    };
    return resultFunc;
}
// only for single characters 
function isDigitChar(c) {
    return (c >= '0' && c <= '9');
}
// only for single characters
// potential for improvement here
// https://en.wikipedia.org/wiki/Whitespace_character
// https://langdev.stackexchange.com/questions/1/which-horizontal-whitespace-should-be-supported
// https://www.unicode.org/reports/tr14/
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
function helperTestMatchSequence(test, charList, start, end) {
    let at = start;
    for (; at < end; at++) {
        const c = charList[at];
        if (!test(c)) {
            break;
        }
    }
    const consumed = at - start;
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
        end - start == 1 && charList[start] == '0'
    Assumes end - start >= 1
    
*/
function helperNoLeadingZeroes(charList, start, end) {
    const first = charList[start];
    if (first != '0') {
        return true;
    }
    // first is zero
    if (end - start == 1) {
        return true;
    }
    return false;
}
/*
    Matches sequence of consecutive digits if it has no leading zeros.
    A single zero will match if followed by non-digit character.
*/
function matchAtomInteger(charList, start, end) {
    const [consumed, success] = helperTestMatchSequence(isDigitChar, charList, start, end);
    if (!success) {
        return [0, false];
    }
    const leadingZerosOk = helperNoLeadingZeroes(charList, start, start + consumed);
    if (leadingZerosOk) {
        return [consumed, true];
    }
    else {
        return [0, false];
    }
}
/*
    Will match an arbitrary string starting and ending with " character
    Handles backslash escapes in manner compatible with json.
    Does not validate json-conformance fully, which is left for later
    in processing pipeline.
*/
function matchAtomString(charList, start, end) {
    // must at least have room for 2 " characters
    const remaining = end - start;
    if (remaining < 2) {
        return [0, false];
    }
    // must start with a " character.
    if (charList[start] != '"') {
        return [0, false];
    }
    //moving pointer past first doublequote
    let at = start + 1;
    let precedingBackslashes = 0;
    for (; at < end; at++) {
        const c = charList[at];
        let escaped = precedingBackslashes % 2 == 1;
        if (c == '"' && !escaped) {
            const consumed = at - start + 1;
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
    const resultFunc = function (charList, start, end) {
        let at = start;
        // loop doesnt perform bound checks on charList as some lex functions
        // can return true with 0 tokens consumed (optionals)
        let fnIndex = 0;
        for (; fnIndex < lexerList.length; fnIndex++) {
            const [consumed, matched] = lexerList[fnIndex](charList, at, end);
            if (!matched) {
                return [0, false];
            }
            at += consumed;
        }
        const consumedTotal = at - start;
        const allFunctionsPassed = (fnIndex == lexerList.length);
        if (allFunctionsPassed) {
            return [consumedTotal, true];
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
    const resultFunc = function (charList, start, end) {
        for (const fn of lexerList) {
            const [consumed, matched] = fn(charList, start, end);
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
    const resultFunc = function (charList, start, end) {
        const [consumed, matched] = lexerFunc(charList, start, end);
        if (matched) {
            return [consumed, matched];
        }
        else {
            return [0, true];
        }
    };
    return resultFunc;
}
/*

    MAIN LEX FUNCTIONS

*/
var funcs;
(function (funcs) {
    funcs.lexOperatorChild = createMatchExact(OperatorsSyntax.CHILD);
    funcs.lexOperatorParent = createMatchExact(OperatorsSyntax.PARENT);
    funcs.lexOperatorSiblingNext = createMatchExact(OperatorsSyntax.SIBLING_NEXT);
    funcs.lexOperatorSiblingPrev = createMatchExact(OperatorsSyntax.SIBLING_PREV);
    funcs.lexOperatorSiblingSubsequent = createMatchExact(OperatorsSyntax.SIBLING_SUBSEQUENT);
    funcs.lexOperatorSiblingPreceding = createMatchExact(OperatorsSyntax.SIBLING_PRECEDING);
    funcs.lexOperatorSiblingAny = createMatchExact(OperatorsSyntax.SIBLING_ANY);
    funcs.lexOperatorOr = createMatchExact(OperatorsSyntax.OR);
    funcs.lexOperatorAnd = createMatchExact(OperatorsSyntax.AND);
    funcs.lexOperatorNot = createMatchExact(OperatorsSyntax.NOT);
    funcs.lexMatchWildcardAll = createMatchExact(OperatorsSyntax.WILDCARD);
    funcs.lexMatchWildcardArray = createMatchExact(OperatorsSyntax.L_BRACKET + OperatorsSyntax.WILDCARD + OperatorsSyntax.R_BRACKET);
    funcs.lexMatchWildcardObject = createMatchExact(OperatorsSyntax.L_BRACE + OperatorsSyntax.WILDCARD + OperatorsSyntax.R_BRACE);
    funcs.lexPrimitiveKindWildcard = createMatchExact(OperatorsSyntax.PRIMITIVE + OperatorsSyntax.WILDCARD);
    funcs.lexPrimitiveKindString = createMatchExact(OperatorsSyntax.PRIMITIVE + "string");
    funcs.lexPrimitiveKindNumber = createMatchExact(OperatorsSyntax.PRIMITIVE + "number");
    funcs.lexPrimitiveKindBoolean = createMatchExact(OperatorsSyntax.PRIMITIVE + "boolean");
    funcs.lexPrimitiveNull = createMatchExact(OperatorsSyntax.PRIMITIVE + "null");
    funcs.lexPrimitiveTrue = createMatchExact(OperatorsSyntax.PRIMITIVE + "true");
    funcs.lexPrimitiveFalse = createMatchExact(OperatorsSyntax.PRIMITIVE + "false");
    function lexWhitespace(charList, start, end) {
        return helperTestMatchSequence(isWhitespaceChar, charList, start, end);
    }
    funcs.lexWhitespace = lexWhitespace;
    function lexMatchKeyNaked(charList, start, end) {
        return helperTestMatchSequence(isAsciiLetterChar, charList, start, end);
    }
    funcs.lexMatchKeyNaked = lexMatchKeyNaked;
    function lexMatchIndexAll(charList, start, end) {
        return matchAtomInteger(charList, start, end);
    }
    funcs.lexMatchIndexAll = lexMatchIndexAll;
    function lexMatchIndexArray(charList, start, end) {
        const matchOpenBracket = createMatchExact(OperatorsSyntax.L_BRACKET);
        const matchClosedBracket = createMatchExact(OperatorsSyntax.R_BRACKET);
        return combinatorChain([
            matchOpenBracket, matchAtomInteger, matchClosedBracket
        ])(charList, start, end);
    }
    funcs.lexMatchIndexArray = lexMatchIndexArray;
    function lexMatchIndexObject(charList, start, end) {
        const matchOpenBrace = createMatchExact(OperatorsSyntax.L_BRACE);
        const matchClosedBrace = createMatchExact(OperatorsSyntax.R_BRACE);
        return combinatorChain([
            matchOpenBrace, matchAtomInteger, matchClosedBrace
        ])(charList, start, end);
    }
    funcs.lexMatchIndexObject = lexMatchIndexObject;
    function lexMatchKey(charList, start, end) {
        return matchAtomString(charList, start, end);
    }
    funcs.lexMatchKey = lexMatchKey;
    function lexPrimitiveString(charList, start, end) {
        const matchPrimitivePrefix = createMatchExact(OperatorsSyntax.PRIMITIVE);
        return combinatorChain([matchPrimitivePrefix, matchAtomString])(charList, start, end);
    }
    funcs.lexPrimitiveString = lexPrimitiveString;
    /*
        https://www.poppastring.com/blog/json-numbers-changed-with-leading-zeros
        
        Json number has 3 sections:
        1: string of digits with no leading zeros and possible minus in front.
        2: possibly: (a dot followed by string of digits)
        3: possibly: e or E followed by possible minus/plus and strings of digits
    */
    function lexPrimitiveNumber(charList, start, end) {
        const matchPrimitivePrefix = createMatchExact(OperatorsSyntax.PRIMITIVE);
        const matchMinus = createMatchExact("-");
        const matchPlus = createMatchExact("+");
        const matchDot = createMatchExact(".");
        const matchLowecaseE = createMatchExact("e");
        const matchUppercaseE = createMatchExact("E");
        const matchDigitString = function (charList, start, end) {
            return helperTestMatchSequence(isDigitChar, charList, start, end);
        };
        const matchPlusOrMinus = combinatorOr([matchPlus, matchMinus]);
        const matchAnyE = combinatorOr([matchLowecaseE, matchUppercaseE]);
        const optionalMinus = combinatorOptional(matchMinus);
        const section1 = combinatorChain([
            optionalMinus,
            matchAtomInteger,
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
        const completeNumberLex = combinatorChain([matchPrimitivePrefix, section1, section2, section3]);
        return completeNumberLex(charList, start, end);
    }
    funcs.lexPrimitiveNumber = lexPrimitiveNumber;
    /*
        Always the last lex function to be called.
        Runs forward looking until a whitespace or significant character is enountered.
        Always consumes at least 1 character.
    */
    function lexError(charList, start, end) {
        const [consumed, matched] = helperTestMatchSequence(isNonWhitespaceNonOperatorChar, charList, start + 1, end);
        if (!matched) {
            return [1, true];
        }
        else {
            return [consumed + 1, true];
        }
    }
    funcs.lexError = lexError;
})(funcs || (exports.funcs = funcs = {}));
