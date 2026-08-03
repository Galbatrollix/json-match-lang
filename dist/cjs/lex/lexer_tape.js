"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utils = void 0;
exports.tokenizeMatchString = tokenizeMatchString;
const lexer_enum_ts_1 = require("./lexer_enum.js");
const lexer_impl_ts_1 = require("./lexer_impl.js");
// autocomplete could behave more sanely if this structure is replaced 
// with interface or with hacks such as, neither is particularly appealing lol
// type NamedAlias<t> = t & { _?: never }
function tokenizeMatchString(input) {
    //codepoints are not always length one, cuz surrogate pairs!
    const codepointList = Array.from(input);
    const lexerOutput = (0, lexer_impl_ts_1.lexJsonMatchCodepoints)(codepointList);
    const tape = assembleTokenTable(lexerOutput, codepointList);
    return tape;
}
/**
    Bundle of utility functions for handling TokenTape values.
*/
var utils;
(function (utils) {
    let misc;
    (function (misc) {
        /**
        Returns true if TokenTape has at least one error token.
        Otherwise returns false.
    */
        function hasError(tape) {
            for (let i = 0; i < tape.tokenCount; i++) {
                if (tape.tokenKind[i] == lexer_enum_ts_1.TokenKind.ERROR) {
                    return true;
                }
            }
            return false;
        }
        misc.hasError = hasError;
        /**
            Returns true only if given token tapes are identical
        */
        function equals(t1, t2) {
            // its more practical to make a guard for potential new properties 
            // than to try to make this function future-proof.
            if (Object.keys(t1).length != 5) {
                throw new Error("THIS FUNCTION NEEDS TO BE UPDATED");
            }
            return (t1.tokenCount == t2.tokenCount
                &&
                    tapeArrayEquals(t1.tokenKind, t2.tokenKind)
                &&
                    tapeArrayEquals(t1.tokenString, t2.tokenString)
                &&
                    tapeArrayEquals(t1.startIdx, t2.startIdx)
                &&
                    tapeArrayEquals(t1.endIdx, t2.endIdx));
        }
        misc.equals = equals;
    })(misc = utils.misc || (utils.misc = {}));
    /**
        Contains functions for data presentation
        purposes only.
    */
    let display;
    (function (display) {
        /**
            Returns token tape encoded as array of strings, with each
            string corresponding to one tokentape entry.
        */
        function asArr(tape) {
            const result = [];
            const numberPad = (tape.tokenKind.length - 1).toString().length + 2;
            const kindPad = 23;
            const kindTruncate = 21;
            const totalPad = 60;
            const maxTokenChars = totalPad - kindPad - 13;
            for (const i in tape.tokenKind) {
                const kind = tape.tokenKind[i];
                const kindString = lexer_enum_ts_1.TokenKind[kind];
                let tokenString = tape.tokenString[i];
                if (kind == lexer_enum_ts_1.TokenKind.WHITESPACE) {
                    tokenString = "";
                }
                const processedTokenString = truncateStrWithEllipsis(tokenString, maxTokenChars);
                const entry = `${i.toString().padEnd(numberPad, " ")}kind: ${truncateStr(kindString, kindTruncate).padEnd(kindPad, " ")}token: ${processedTokenString}`.padEnd(totalPad, " ");
                result.push(entry);
            }
            return result;
        }
        display.asArr = asArr;
        /**
            Returns token tape encoded as a single string with line
            separators. Mainly for printing in console.
        */
        function asStr(tape) {
            const entries = asArr(tape);
            for (const i in entries) {
                entries[i] = replaceWhitespaceWithSpaces(entries[i]);
            }
            return entries.join("\n");
        }
        display.asStr = asStr;
        /**
            Returns token tape encoded as HTML for display with syntax highlight
            and whatnot. Troublesome characters are replaced with escape sequences
            for the text to be injectable with a simple .innerHTML call

            With string string token "T" and with its tokenKind as "K":
            Then, with:  TokenKind[K] as "KINDIDENTIFIER"
            Then, with escaped "T" as "ESCAPED_T"
            
            Each token renders as such:
            <span class=KINDIDENTIFIER>ESCAPED_T</span>
            Span items are joined with no whitespace inbetween.
        */
        function asHtml(tape) {
            function escapeHtml(unsafe) {
                return unsafe
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            }
            ;
            const spanList = [];
            for (let i = 0; i < tape.tokenCount; i++) {
                const kindIdentifier = lexer_enum_ts_1.TokenKind[tape.tokenKind[i]];
                const escapedToken = escapeHtml(tape.tokenString[i]);
                spanList.push(`<span class=${kindIdentifier}>${escapedToken}</span>`);
            }
            return spanList.join("");
        }
        display.asHtml = asHtml;
    })(display = utils.display || (utils.display = {}));
})(utils || (exports.utils = utils = {}));
function assembleTokenTable(lexerOutput, codepointList) {
    const resultKinds = [];
    const resultStrings = [];
    for (let i = 1; i < lexerOutput.length; i++) {
        const startIdx = lexerOutput[i - 1].endIdx;
        const endIdx = lexerOutput[i].endIdx;
        const kind = lexerOutput[i].kind;
        const tokenSlice = codepointList.slice(startIdx, endIdx);
        const tokenString = tokenSlice.join("");
        resultKinds.push(kind);
        resultStrings.push(tokenString);
    }
    // obtaining input string char ranges
    const { resultStartIdx, resultEndIdx } = tokensToCharRanges(resultStrings);
    // constructing output
    const result = {
        tokenCount: lexerOutput.length - 1,
        tokenKind: Object.freeze(resultKinds),
        tokenString: Object.freeze(resultStrings),
        startIdx: Object.freeze(resultStartIdx),
        endIdx: Object.freeze(resultEndIdx),
    };
    return Object.freeze(result);
}
/**
    Reconstructs index ranges of original input string from
    stream of consecutive tokens string spat out by the tokenizer.
    Returned as SOA {resultStartIdx[i], resultEndIdx[i]}
*/
function tokensToCharRanges(tokenStrings) {
    if (tokenStrings.length == 0) {
        return { resultStartIdx: [], resultEndIdx: [] };
    }
    let previous = tokenStrings[0].length;
    const start = [0];
    const end = [previous];
    for (let i = 1; i < tokenStrings.length; i++) {
        const current = tokenStrings[i].length + previous;
        start.push(previous);
        end.push(current);
        previous = current;
    }
    return { resultStartIdx: start, resultEndIdx: end };
}
/*
    Print helpers
*/
function truncateStr(s, maxLength) {
    return s.slice(0, maxLength);
}
// max length must be at least 7.
function truncateStrWithEllipsis(s, maxLength) {
    if (maxLength < 7) {
        return s;
    }
    if (s.length <= maxLength) {
        return s;
    }
    // s is too long
    const sliced = s.slice(0, maxLength - 5);
    return sliced + "(...)";
}
function replaceWhitespaceWithSpaces(s) {
    return s.replace(/[\f\n\r\t\v\u00A0\u2028\u2029]/g, " ");
}
/*
    A helper for comparing tape pararell arrays for equality.
    Returns true if both are equal
*/
function tapeArrayEquals(arr1, arr2) {
    if (arr1.length != arr2.length) {
        return false;
    }
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] != arr2[i]) {
            return false;
        }
    }
    return true;
}
