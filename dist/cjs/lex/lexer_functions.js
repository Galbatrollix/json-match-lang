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
    L_PARENTHESIS: "(",
    R_PARENTHESIS: ")",
    WILDCARD: "*",
    PRIMITIVE: "#",
    STRING: `"`,
};
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

    PARSER GENERATORS AND COMBINATORS

*/
/**
    Parser generator that produces a lex function that:
        tries to match longest string containing only characters
        that pass the test provided via test function parameter.
        If first character doesn't pass th test, function will return [0, false]
*/
function createMatchTestSequence(test) {
    const resultFunc = function (charList, start, end) {
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
    };
    return resultFunc;
}
/**
    Parser generator that produces a lex function that:
        will either exactly match pattern string by consuming pattern.length
        characters or will fail and return [0, false]
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
/**
    Parser generator that produces a lex function that:
        will either  match a non-empty and non-full prefix of pattern string
        by consuming <1, pattern.length - 1> characters until character in charList
        are exhausted.
        
        If the entire pattern string can match, function will throw an error.
        If not a single character can match, function will return [0, false].
        If a valid prefix matches, but not all characters are consumed,
            function will also fail and will return [0, false]
        Otherwise: function will return [prefixLength, true],
             which must be equal to [end - start, true].
*/
function createMatchIncompleteExact(pattern) {
    const patternCodepoints = Array.from(pattern);
    const resultFunc = function (charList, start, end) {
        const remaining = end - start;
        // nothing can match if there is no characters remaining
        if (remaining == 0) {
            return [0, false];
        }
        const charsToScan = Math.min(remaining, patternCodepoints.length);
        for (let i = 0; i < charsToScan; i++) {
            const at = i + start;
            if (patternCodepoints[i] != charList[at]) {
                return [0, false];
            }
        }
        //all chars to scan matched
        if (charsToScan == patternCodepoints.length) {
            throw new Error("Match incomplete exact matched a complete pattern");
        }
        else {
            return [remaining, true];
        }
    };
    return resultFunc;
}
/**
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
// function combinatorOptional(lexerFunc: LexFunction): LexFunction {
// 	const resultFunc = function(
// 		charList: Array<string>,
// 		start: number,
// 		end: number
// 	): [number, boolean] {
// 		const [consumed, matched] = lexerFunc(charList, start, end);
// 		if (matched) {
// 			return [consumed, matched];
// 		}else{
// 			return [0, true];	
// 		}
// 	}
// 	return resultFunc;
// }
/*

    PARSER PRIMITIVES

*/
/**
    Matches a sequence of at least 1 consecutive digits.
*/
const matchDigitSequence = createMatchTestSequence(isDigitChar);
/*
    Matches sequence of consecutive digits if it has no leading zeros.
    A single zero will match if followed by non-digit character or end
    of characters stream.
*/
function matchInteger(charList, start, end) {
    const [consumed, success] = matchDigitSequence(charList, start, end);
    if (!success) {
        return [0, false];
    }
    const firstIsZero = charList[start] == '0';
    if (firstIsZero && consumed != 1) {
        return [0, false];
    }
    else {
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
function matchString(charList, start, end) {
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
        const escaped = precedingBackslashes % 2 == 1;
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
    // charList ran out of characters without matching the string, match failed
    return [0, false];
}
/**
    Similar to matchString, except it matches only incomplete strings -
    that is strings that have opening quote and do not run into
    closing qote before running out of characters in charList.

    Will throw error if it matches a complete string. It should be called
    after the normal string function determined there is no complete string match.
*/
function matchIncompleteString(charList, start, end) {
    // must at least have room for " character
    const remaining = end - start;
    if (remaining < 1) {
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
        const escaped = precedingBackslashes % 2 == 1;
        if (c == '"' && !escaped) {
            throw new Error("Fatal error: incomplete string match called on complete string" +
                " Make sure to verify complete string doesnt match first!");
        }
        if (c == '\\') {
            precedingBackslashes += 1;
        }
        else {
            precedingBackslashes = 0;
        }
    }
    // charList ran out of characters without matching the string,
    // this means that the incomplete string match condition is fulfilled
    return [end - start, true];
}
const matchOpenBracket = createMatchExact(OperatorsSyntax.L_BRACKET);
const matchClosedBracket = createMatchExact(OperatorsSyntax.R_BRACKET);
const matchOpenBrace = createMatchExact(OperatorsSyntax.L_BRACE);
const matchClosedBrace = createMatchExact(OperatorsSyntax.R_BRACE);
const matchPrimitivePrefix = createMatchExact(OperatorsSyntax.PRIMITIVE);
/**
    A bunch of things that together represent a finite state machine
    designed to parse valid JSON numbers, designed to be also usable
    for determining partial number matches.
*/
var numberFSM;
(function (numberFSM) {
    /*
        https://www.poppastring.com/blog/json-numbers-changed-with-leading-zeros
        https://www.json.org/json-en.html
        https://ecma-international.org/wp-content/uploads/ECMA-404_2nd_edition_december_2017.pdf
        
        Json number has 3 sections:
        1: string of digits with no leading zeros and possible minus in front.
        2: possibly: (a dot followed by string of digits)
        3: possibly: (e or E followed by possible minus/plus followed by string of digits)
    */
    numberFSM.states = {
        START: 0,
        AFTER_LEADING_ZERO: 1,
        DIGIT_SECTION_ONE: 2,
        AFTER_DOT: 3,
        DIGIT_SECTION_TWO: 4,
        AFTER_E: 5,
        DIGIT_SECTION_THREE: 6,
        FINISHED: 999,
        FAILED: 1000,
    };
    function init() {
        return {
            mainState: numberFSM.states.START,
            optionalMinusDone: false,
            plusMinusDone: false,
        };
    }
    numberFSM.init = init;
    function progress(fsm, char) {
        const isDigit = isDigitChar(char);
        switch (fsm.mainState) {
            case numberFSM.states.START:
                {
                    if (char == '-' && !fsm.optionalMinusDone) {
                        fsm.optionalMinusDone = true;
                        // continues in state START
                    }
                    else if (char == '0') {
                        fsm.mainState = numberFSM.states.AFTER_LEADING_ZERO;
                    }
                    else if (isDigit) {
                        fsm.mainState = numberFSM.states.DIGIT_SECTION_ONE;
                    }
                    else {
                        fsm.mainState = numberFSM.states.FAILED;
                    }
                }
                return;
            case numberFSM.states.AFTER_LEADING_ZERO:
                {
                    if (char == ".") {
                        fsm.mainState = numberFSM.states.AFTER_DOT;
                    }
                    else if (char == 'e' || char == 'E') {
                        fsm.mainState = numberFSM.states.AFTER_E;
                    }
                    else {
                        fsm.mainState = numberFSM.states.FINISHED;
                    }
                }
                return;
            case numberFSM.states.DIGIT_SECTION_ONE:
                {
                    if (char == ".") {
                        fsm.mainState = numberFSM.states.AFTER_DOT;
                    }
                    else if (char == 'e' || char == 'E') {
                        fsm.mainState = numberFSM.states.AFTER_E;
                    }
                    else if (isDigit) {
                        // continues in state DIGIT_SECTION_ONE
                    }
                    else {
                        fsm.mainState = numberFSM.states.FINISHED;
                    }
                }
                return;
            case numberFSM.states.AFTER_DOT:
                {
                    if (isDigit) {
                        fsm.mainState = numberFSM.states.DIGIT_SECTION_TWO;
                    }
                    else {
                        fsm.mainState = numberFSM.states.FAILED;
                    }
                }
                return;
            case numberFSM.states.DIGIT_SECTION_TWO:
                {
                    if (char == 'e' || char == 'E') {
                        fsm.mainState = numberFSM.states.AFTER_E;
                    }
                    else if (isDigit) {
                        // continues in state DIGIT_SECTION_TWO
                    }
                    else {
                        fsm.mainState = numberFSM.states.FINISHED;
                    }
                }
                return;
            case numberFSM.states.AFTER_E:
                {
                    if ((char == '-' || char == '+') && !fsm.plusMinusDone) {
                        fsm.plusMinusDone = true;
                        // continues in state AFTER_E
                    }
                    else if (isDigit) {
                        fsm.mainState = numberFSM.states.DIGIT_SECTION_THREE;
                    }
                    else {
                        fsm.mainState = numberFSM.states.FAILED;
                    }
                }
                return;
            case numberFSM.states.DIGIT_SECTION_THREE:
                {
                    if (isDigit) {
                        // continues in state DIGIT_SECTION_THREE
                    }
                    else {
                        fsm.mainState = numberFSM.states.FINISHED;
                    }
                }
                return;
            case numberFSM.states.FAILED:
            case numberFSM.states.FINISHED: {
                throw new Error("Fatal error, number state machine called after finishing");
            }
            default: fsm.mainState;
        }
    }
    numberFSM.progress = progress;
})(numberFSM || (numberFSM = {}));
/**
    Lex function that matches any JSON conformant number,
    trying to go as far as possible when matching.
*/
function matchJsonNumber(charList, start, end) {
    const fsm = numberFSM.init();
    for (let at = start; at < end; at++) {
        const c = charList[at];
        numberFSM.progress(fsm, c);
        if (fsm.mainState == numberFSM.states.FINISHED) {
            return [at - start, true];
        }
        else if (fsm.mainState == numberFSM.states.FAILED) {
            return [0, false];
        }
    }
    // ran out of characters, so push a terminating char and read result.
    numberFSM.progress(fsm, " ");
    if (fsm.mainState == numberFSM.states.FINISHED) {
        return [end - start, true];
    }
    else {
        return [0, false];
    }
}
/**
    Similar to matchJsonNumber, but will match only
    if after consuming last character from the list the parsed
    number is not valid (such as 1.3e) as if there is e, valid number
    MUST have digits after e.

    If this function happens to parse a complete number it will
    throw an error.
*/
function matchIncompleteJsonNumber(charList, start, end) {
    const fsm = numberFSM.init();
    for (let at = start; at < end; at++) {
        const c = charList[at];
        numberFSM.progress(fsm, c);
        if (fsm.mainState == numberFSM.states.FINISHED) {
            throw new Error("Fatal error: incomplete number match called on complete number" +
                " Make sure to verify complete number doesnt match first!");
        }
        else if (fsm.mainState == numberFSM.states.FAILED) {
            return [0, false];
        }
    }
    // ran out of characters, so push a terminating char and read result.
    numberFSM.progress(fsm, " ");
    if (fsm.mainState == numberFSM.states.FINISHED) {
        throw new Error("Fatal error: incomplete number match called on complete number" +
            " Make sure to verify complete number doesnt match first!");
    }
    else {
        return [end - start, true];
    }
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
    funcs.lexParenthesisLeft = createMatchExact(OperatorsSyntax.L_PARENTHESIS);
    funcs.lexParenthesisRight = createMatchExact(OperatorsSyntax.R_PARENTHESIS);
    funcs.lexMatchWildcardArray = createMatchExact(OperatorsSyntax.L_BRACKET + OperatorsSyntax.WILDCARD + OperatorsSyntax.R_BRACKET);
    funcs.lexMatchWildcardObject = createMatchExact(OperatorsSyntax.L_BRACE + OperatorsSyntax.WILDCARD + OperatorsSyntax.R_BRACE);
    funcs.lexPrimitiveKindWildcard = createMatchExact(OperatorsSyntax.PRIMITIVE + OperatorsSyntax.WILDCARD);
    funcs.lexPrimitiveKindString = createMatchExact(OperatorsSyntax.PRIMITIVE + "string");
    funcs.lexPrimitiveKindNumber = createMatchExact(OperatorsSyntax.PRIMITIVE + "number");
    funcs.lexPrimitiveKindBoolean = createMatchExact(OperatorsSyntax.PRIMITIVE + "boolean");
    funcs.lexPrimitiveNull = createMatchExact(OperatorsSyntax.PRIMITIVE + "null");
    funcs.lexPrimitiveTrue = createMatchExact(OperatorsSyntax.PRIMITIVE + "true");
    funcs.lexPrimitiveFalse = createMatchExact(OperatorsSyntax.PRIMITIVE + "false");
    funcs.lexWhitespace = createMatchTestSequence(isWhitespaceChar);
    funcs.lexMatchKeyNaked = createMatchTestSequence(isAsciiLetterChar);
    funcs.lexMatchIndexAll = matchInteger;
    funcs.lexMatchIndexArray = combinatorChain([matchOpenBracket, matchInteger, matchClosedBracket]);
    funcs.lexMatchIndexObject = combinatorChain([matchOpenBrace, matchInteger, matchClosedBrace]);
    funcs.lexMatchKey = matchString;
    funcs.lexPrimitiveString = combinatorChain([matchPrimitivePrefix, matchString]);
    funcs.lexPrimitiveNumber = combinatorChain([matchPrimitivePrefix, matchJsonNumber]);
    funcs.lexErrorIncompleteKey = matchIncompleteString;
    funcs.lexErrorIncompletePrimitive = combinatorOr([
        createMatchIncompleteExact(OperatorsSyntax.PRIMITIVE + "string"),
        createMatchIncompleteExact(OperatorsSyntax.PRIMITIVE + "number"),
        createMatchIncompleteExact(OperatorsSyntax.PRIMITIVE + "boolean"),
        createMatchIncompleteExact(OperatorsSyntax.PRIMITIVE + "null"),
        createMatchIncompleteExact(OperatorsSyntax.PRIMITIVE + "true"),
        createMatchIncompleteExact(OperatorsSyntax.PRIMITIVE + "false"),
        combinatorChain([matchPrimitivePrefix, matchIncompleteString]),
        combinatorChain([matchPrimitivePrefix, matchIncompleteJsonNumber]),
    ]);
    /*
        Always the last lex function to be called.
        Runs forward looking until a whitespace or significant character is enocuntered.
        Always consumes at least 1 character and always matches.
    */
    function lexError(charList, start, end) {
        const matchUntilReset = createMatchTestSequence(isNonWhitespaceNonOperatorChar);
        const [consumed, matched] = matchUntilReset(charList, start + 1, end);
        if (!matched) {
            return [1, true];
        }
        else {
            return [consumed + 1, true];
        }
    }
    funcs.lexError = lexError;
})(funcs || (exports.funcs = funcs = {}));
