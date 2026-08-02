"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenTapeUtils = void 0;
exports.tokenizeString = tokenizeString;
const lexer_enum_ts_1 = require("./lexer_enum.js");
const lexer_impl_ts_1 = require("./lexer_impl.js");
function tokenizeString(input) {
    //codepoints are not always length one, cuz surrogate pairs!
    const codepointList = Array.from(input);
    const lexed = (0, lexer_impl_ts_1.lexJsonPathString)(codepointList);
    const resultKinds = [];
    const resultStrings = [];
    for (let i = 1; i < lexed.length; i++) {
        const startIdx = lexed[i - 1].endIdx;
        const endIdx = lexed[i].endIdx;
        const kind = lexed[i].kind;
        const tokenSlice = codepointList.slice(startIdx, endIdx);
        const tokenString = tokenSlice.join("");
        resultKinds.push(kind);
        resultStrings.push(tokenString);
    }
    const result = {
        length: lexed.length - 1,
        tokenKinds: Object.freeze(resultKinds),
        tokenStrings: Object.freeze(resultStrings),
    };
    return Object.freeze(result);
}
/**
    Bundle of utility functions for handling TokenTape values.
*/
var tokenTapeUtils;
(function (tokenTapeUtils) {
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
            const numberPad = (tape.tokenKinds.length - 1).toString().length + 2;
            const kindPad = 23;
            const kindTruncate = 21;
            const totalPad = 60;
            const maxTokenChars = totalPad - kindPad - 13;
            for (const i in tape.tokenKinds) {
                const kind = tape.tokenKinds[i];
                const kindString = lexer_enum_ts_1.TokenKind[kind];
                let tokenString = tape.tokenStrings[i];
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
    })(display = tokenTapeUtils.display || (tokenTapeUtils.display = {}));
})(tokenTapeUtils || (exports.tokenTapeUtils = tokenTapeUtils = {}));
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
