"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrityCheckBasic = integrityCheckBasic;
exports.integrityCheckDeep = integrityCheckDeep;
exports.integrityCheckFull = integrityCheckFull;
exports.soaOk = soaOk;
exports.noDupeErrors = noDupeErrors;
exports.incomplesOnlyInLastSlot = incomplesOnlyInLastSlot;
exports.recursiveOk = recursiveOk;
exports.stringSumOk = stringSumOk;
exports.tokenizeAgainOk = tokenizeAgainOk;
const lexer_tape_ts_1 = require("./lexer_tape.js");
const lexer_enum_ts_1 = require("./lexer_enum.js");
function integrityCheckBasic(tape) {
    return (soaOk(tape)
        &&
            noDupeErrors(tape)
        &&
            incomplesOnlyInLastSlot(tape));
}
function integrityCheckDeep(tape) {
    return integrityCheckBasic(tape) && recursiveOk(tape);
}
function integrityCheckFull(tape, originalInput) {
    return (integrityCheckDeep(tape)
        &&
            stringSumOk(tape, originalInput)
        &&
            tokenizeAgainOk(tape, originalInput));
}
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
        if (lexer_enum_ts_1.enumUtils.isErrorIncomplete(kind)) {
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
        const recursiveTape = (0, lexer_tape_ts_1.tokenizeMatchString)(s);
        if (lexer_enum_ts_1.enumUtils.isError(kind)) {
            // possible case where error is split into error and incomplete
            const twoElementsCase = (recursiveTape.tokenCount == 2
                &&
                    recursiveTape.tokenString.join("") == s
                &&
                    recursiveTape.tokenKind[0] == lexer_enum_ts_1.TokenKind.ERROR
                &&
                    lexer_enum_ts_1.enumUtils.isErrorIncomplete(recursiveTape.tokenKind[1]));
            // possible case where error is not split but might become an incomplete
            const oneElementCase = (recursiveTape.tokenCount == 1
                &&
                    recursiveTape.tokenString[0] == s
                &&
                    lexer_enum_ts_1.enumUtils.isError(recursiveTape.tokenKind[0]));
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
    const tokenizedAgain = (0, lexer_tape_ts_1.tokenizeMatchString)(originalInput);
    return lexer_tape_ts_1.utils.misc.equals(tape, tokenizedAgain);
}
