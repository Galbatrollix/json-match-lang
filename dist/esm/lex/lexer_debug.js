import { tokenizeExpressionString, utils } from "./lexer_tape.js";
import { TokenKind, enumUtils } from "./lexer_enum.js";
export function integrityCheckBasic(tape) {
    return (soaOk(tape)
        &&
            noDupeErrors(tape)
        &&
            incomplesOnlyInLastSlot(tape));
}
export function integrityCheckDeep(tape) {
    return integrityCheckBasic(tape) && recursiveOk(tape);
}
export function integrityCheckFull(tape, originalInput) {
    return (integrityCheckDeep(tape)
        &&
            stringSumOk(tape, originalInput)
        &&
            tokenizeAgainOk(tape, originalInput));
}
/**
    Returns true only if TokenTape SoA structure is consistent.
*/
export function soaOk(tape) {
    return (tape.tokenCount == tape.tokenKind.length
        &&
            tape.tokenCount == tape.tokenString.length);
}
/**
    Returns true only if no error tokens exist within the tape
    in neighborhood of other error tokens. Only considers plain
    error tokens. Ignores incomplete-error tokens.
*/
export function noDupeErrors(tape) {
    if (tape.tokenCount < 2)
        return true;
    for (let i = 1; i < tape.tokenCount; i++) {
        const left = tape.tokenKind[i - 1];
        const right = tape.tokenKind[i];
        if (left == TokenKind.ERROR && right == TokenKind.ERROR) {
            return false;
        }
    }
    return true;
}
/**
    Returns true only if no incomplete-error token
    is at the list position other than last.
*/
export function incomplesOnlyInLastSlot(tape) {
    for (let i = 0; i < tape.tokenCount - 1; i++) {
        const kind = tape.tokenKind[i];
        if (enumUtils.isErrorIncomplete(kind)) {
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
export function recursiveOk(tape) {
    for (let i = 0; i < tape.tokenCount; i++) {
        const s = tape.tokenString[i];
        const kind = tape.tokenKind[i];
        const recursiveTape = tokenizeExpressionString(s);
        if (enumUtils.isError(kind)) {
            // possible case where error is split into error and incomplete
            const twoElementsCase = (recursiveTape.tokenCount == 2
                &&
                    recursiveTape.tokenString.join("") == s
                &&
                    recursiveTape.tokenKind[0] == TokenKind.ERROR
                &&
                    enumUtils.isErrorIncomplete(recursiveTape.tokenKind[1]));
            // possible case where error is not split but might become an incomplete
            const oneElementCase = (recursiveTape.tokenCount == 1
                &&
                    recursiveTape.tokenString[0] == s
                &&
                    enumUtils.isError(recursiveTape.tokenKind[0]));
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
export function stringSumOk(tape, originalInput) {
    return tape.tokenString.join("") == originalInput;
}
/**
    Returns true only if original input yields
    exactly the same tape when tokenized again
*/
export function tokenizeAgainOk(tape, originalInput) {
    const tokenizedAgain = tokenizeExpressionString(originalInput);
    return utils.misc.equals(tape, tokenizedAgain);
}
