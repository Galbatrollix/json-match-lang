import { type TokenTape } from "./lexer_tape.ts";
export declare function integrityCheckBasic(tape: TokenTape): boolean;
export declare function integrityCheckDeep(tape: TokenTape): boolean;
export declare function integrityCheckFull(tape: TokenTape, originalInput: string): boolean;
/**
    Returns true only if TokenTape SoA structure is consistent.
*/
export declare function soaOk(tape: TokenTape): boolean;
/**
    Returns true only if no error tokens exist within the tape
    in neighborhood of other error tokens. Only considers plain
    error tokens. Ignores incomplete-error tokens.
*/
export declare function noDupeErrors(tape: TokenTape): boolean;
/**
    Returns true only if no incomplete-error token
    is at the list position other than last.
*/
export declare function incomplesOnlyInLastSlot(tape: TokenTape): boolean;
/**
    Returns true only if contents of string and indexes arrays are consistent.
*/
export declare function stringsOk(tape: TokenTape): boolean;
/**
    Returns true only if all tokens of the tape
    parse into themselves when fed to the tokenizer.
*/
export declare function recursiveOk(tape: TokenTape): boolean;
/**
    Returns true only if contents of tape strings sum up to the original input string.
*/
export declare function stringSumOk(tape: TokenTape, originalInput: string): boolean;
/**
    Returns true only if original input yields
    exactly the same tape when tokenized again
*/
export declare function tokenizeAgainOk(tape: TokenTape, originalInput: string): boolean;
//# sourceMappingURL=lexer_debug.d.ts.map