"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debug = void 0;
const lexer_main_ts_1 = require("./lexer_main.js");
const lexer_enum_ts_1 = require("./lexer_enum.js");
/*
export type TokenTape = Readonly <{
    tokenCount:   Readonly<number>;

    tokenKind:    Readonly<Array<TokenKind>>;
    tokenString:  Readonly<Array<string>>;
    startIdx:     Readonly<Array<number>>;
    endIdx:       Readonly<Array<number>>;
}>

*/
var debug;
(function (debug) {
    function integrityCheckBasic(tape) {
        return soaOk(tape) && stringsOk(tape) && noDupeErrors(tape);
    }
    debug.integrityCheckBasic = integrityCheckBasic;
    function integrityCheckDeep(tape) {
        return integrityCheckBasic(tape) && recursiveOk(tape);
    }
    debug.integrityCheckDeep = integrityCheckDeep;
    function integrityCheckFull(tape, originalInput) {
        return (integrityCheckDeep(tape)
            &&
                stringSumOk(tape, originalInput)
            &&
                tokenizeAgainOk(tape, originalInput));
    }
    debug.integrityCheckFull = integrityCheckFull;
    /**
        Returns true only if TokenTape SoA structure is consistent.
    */
    function soaOk(tape) {
        return (tape.tokenCount == tape.tokenKind.length
            &&
                tape.tokenCount == tape.tokenString.length
            &&
                tape.tokenCount == tape.startIdx.length
            &&
                tape.tokenCount == tape.endIdx.length);
    }
    debug.soaOk = soaOk;
    /**
        Returns true only if no error tokens exist within the tape
        in neighborhood of other error tokens.
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
    debug.noDupeErrors = noDupeErrors;
    /**
        Returns true only if contents of string and indexes arrays are consistent.
    */
    function stringsOk(tape) {
        let accumulatedLength = 0;
        for (let i = 0; i < tape.tokenCount; i++) {
            const strlen = tape.tokenString[i].length;
            const expectedStart = accumulatedLength;
            const expectedEnd = accumulatedLength + strlen;
            if (expectedStart != tape.startIdx[i] || expectedEnd != tape.endIdx[i]) {
                return false;
            }
            accumulatedLength += strlen;
        }
        return true;
    }
    debug.stringsOk = stringsOk;
    /**
        Returns true only if all tokens of the tape
        parse into themselves when fed to the tokenizer.
    */
    function recursiveOk(tape) {
        for (let i = 0; i < tape.tokenCount; i++) {
            const s = tape.tokenString[i];
            const recursiveTape = (0, lexer_main_ts_1.tokenizeString)(s);
            if (recursiveTape.tokenCount != 1 || recursiveTape.tokenString[0] != s) {
                // console.log(`FAILED AT STRING: ${i}: ${s}`);
                // console.log("GOT: ", recursiveTape);
                return false;
            }
        }
        return true;
    }
    debug.recursiveOk = recursiveOk;
    /**
        Returns true only if contents of tape strings sum up to the original input string.
    */
    function stringSumOk(tape, originalInput) {
        return tape.tokenString.join("") == originalInput;
    }
    debug.stringSumOk = stringSumOk;
    /**
        Returns true only if original input yields exactly tape when tokenized again
    */
    function tokenizeAgainOk(tape, originalInput) {
        const tokenizedAgain = (0, lexer_main_ts_1.tokenizeString)(originalInput);
        return lexer_main_ts_1.tokenTapeUtils.equals(tape, tokenizedAgain);
    }
    debug.tokenizeAgainOk = tokenizeAgainOk;
})(debug || (exports.debug = debug = {}));
