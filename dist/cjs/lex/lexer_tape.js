"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenTapeUtils = void 0;
const lexer_enum_ts_1 = require("./lexer_enum.js");
const lexer_tokenize_ts_1 = require("./lexer_tokenize.js");
/**
    Bundle of utility functions for handling TokenTape values.
*/
var TokenTapeUtils;
(function (TokenTapeUtils) {
    /**
        Contains general purpose utility functions such as
        comparing two tapes or checking if tape has error.
    */
    let Misc;
    (function (Misc) {
        /**
            Returns true if TokenTape has at least one error token.
            Otherwise returns false.
        */
        function hasErrors(tape) {
            for (let i = 0; i < tape.tokenCount; i++) {
                if (lexer_enum_ts_1.TokenKindUtils.isError(tape.tokenKind[i])) {
                    return true;
                }
            }
            return false;
        }
        Misc.hasErrors = hasErrors;
        /**
            Returns true only if given token tapes are identical
        */
        function equals(t1, t2) {
            // its more practical to make a guard for potential new properties 
            // than to try to make this function future-proof.
            if (Object.keys(t1).length != 3) {
                throw new Error("THIS FUNCTION NEEDS TO BE UPDATED");
            }
            return (t1.tokenCount == t2.tokenCount
                &&
                    tapeArrayEquals(t1.tokenKind, t2.tokenKind)
                &&
                    tapeArrayEquals(t1.tokenString, t2.tokenString));
        }
        Misc.equals = equals;
        /**
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
    })(Misc = TokenTapeUtils.Misc || (TokenTapeUtils.Misc = {}));
    /**
        Contains functions for data presentation
        purposes only.
    */
    let Display;
    (function (Display) {
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
        Display.asArr = asArr;
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
        Display.asStr = asStr;
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
        Display.asHtml = asHtml;
        /**
            Exports tokenkinds of TokenTape as a string that represents
            JS array that could be plucked directly into code.

            Each tokenkind string identifier is prepended with value of prefix parameter.
            If prefix is not specified, prepends nothing.
        
            Example output with "tk." prefix:
                 "[tk.WHITESPACE, tk.ERROR, tk.OPERATOR_AND, ]"
        */
        function asReadableKinds(kinds, prefix = "") {
            const toJoin = ['['];
            for (let i = 0; i < kinds.length; i++) {
                const kindIdentifier = lexer_enum_ts_1.TokenKind[kinds[i]];
                toJoin.push(prefix);
                toJoin.push(kindIdentifier);
                toJoin.push(", ");
            }
            toJoin.push(']');
            return toJoin.join("");
        }
        Display.asReadableKinds = asReadableKinds;
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
    })(Display = TokenTapeUtils.Display || (TokenTapeUtils.Display = {}));
    let Debug;
    (function (Debug) {
        function integrityCheckBasic(tape) {
            return (soaOk(tape)
                &&
                    noDupeErrors(tape)
                &&
                    incomplesOnlyInLastSlot(tape));
        }
        Debug.integrityCheckBasic = integrityCheckBasic;
        function integrityCheckDeep(tape) {
            return integrityCheckBasic(tape) && recursiveOk(tape);
        }
        Debug.integrityCheckDeep = integrityCheckDeep;
        function integrityCheckFull(tape, originalInput) {
            return (integrityCheckDeep(tape)
                &&
                    stringSumOk(tape, originalInput)
                &&
                    tokenizeAgainOk(tape, originalInput));
        }
        Debug.integrityCheckFull = integrityCheckFull;
        /**
            Returns true only if TokenTape SoA structure is consistent.
        */
        function soaOk(tape) {
            return (tape.tokenCount == tape.tokenKind.length
                &&
                    tape.tokenCount == tape.tokenString.length);
        }
        /**
            Returns true only if no error tokens exist within the tape
            in neighborhood of other error tokens. Only considers plain
            error tokens. Ignores incomplete-error tokens.
        */
        function noDupeErrors(tape) {
            if (tape.tokenCount < 2)
                return true;
            for (let i = 1; i < tape.tokenCount; i++) {
                const left = tape.tokenKind[i - 1];
                const right = tape.tokenKind[i];
                if (left == lexer_enum_ts_1.TokenKind.ERROR && right == lexer_enum_ts_1.TokenKind.ERROR) {
                    return false;
                }
            }
            return true;
        }
        /**
            Returns true only if no incomplete-error token
            is at the list position other than last.
        */
        function incomplesOnlyInLastSlot(tape) {
            for (let i = 0; i < tape.tokenCount - 1; i++) {
                const kind = tape.tokenKind[i];
                if (lexer_enum_ts_1.TokenKindUtils.isErrorIncomplete(kind)) {
                    return false;
                }
            }
            return true;
        }
        /**
            Returns true only if all tokens of the tape
            parse into themselves when fed to the tokenizer.
            
            An exception to that rule are Erorr tokens that may parse
            into an error token and error incomplete token pair or
            just an error incomplete token.
        */
        function recursiveOk(tape) {
            for (let i = 0; i < tape.tokenCount; i++) {
                const s = tape.tokenString[i];
                const kind = tape.tokenKind[i];
                const recursiveTape = (0, lexer_tokenize_ts_1.tokenizeExpressionString)(s);
                if (lexer_enum_ts_1.TokenKindUtils.isError(kind)) {
                    // possible case where error is split into error and incomplete
                    const twoElementsCase = (recursiveTape.tokenCount == 2
                        &&
                            recursiveTape.tokenString.join("") == s
                        &&
                            recursiveTape.tokenKind[0] == lexer_enum_ts_1.TokenKind.ERROR
                        &&
                            lexer_enum_ts_1.TokenKindUtils.isErrorIncomplete(recursiveTape.tokenKind[1]));
                    // possible case where error is not split but might become an incomplete
                    const oneElementCase = (recursiveTape.tokenCount == 1
                        &&
                            recursiveTape.tokenString[0] == s
                        &&
                            lexer_enum_ts_1.TokenKindUtils.isError(recursiveTape.tokenKind[0]));
                    // if neither one or two elements variant happened then something is wrong
                    if (!oneElementCase && !twoElementsCase) {
                        return false;
                    }
                }
                else if (recursiveTape.tokenCount != 1
                    || recursiveTape.tokenString[0] != s
                    || recursiveTape.tokenKind[0] != kind) {
                    // console.log(`FAILED AT STRING: ${i}: ${s}`);
                    // console.log("GOT: ", recursiveTape);
                    // console.log("Fault at token:" + String(i));
                    return false;
                }
            }
            return true;
        }
        /**
            Returns true only if contents of tape strings sum up to the original input string.
        */
        function stringSumOk(tape, originalInput) {
            return tape.tokenString.join("") == originalInput;
        }
        /**
            Returns true only if original input yields
            exactly the same tape when tokenized again
        */
        function tokenizeAgainOk(tape, originalInput) {
            const tokenizedAgain = (0, lexer_tokenize_ts_1.tokenizeExpressionString)(originalInput);
            return TokenTapeUtils.Misc.equals(tape, tokenizedAgain);
        }
    })(Debug = TokenTapeUtils.Debug || (TokenTapeUtils.Debug = {}));
})(TokenTapeUtils || (exports.TokenTapeUtils = TokenTapeUtils = {}));
