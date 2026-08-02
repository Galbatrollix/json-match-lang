import { type TokenTape } from "./lexer_main.ts";
export declare namespace debug {
    function integrityCheckBasic(tape: TokenTape): boolean;
    function integrityCheckDeep(tape: TokenTape): boolean;
    function integrityCheckFull(tape: TokenTape, originalInput: string): boolean;
    /**
        Returns true only if TokenTape SoA structure is consistent.
    */
    function soaOk(tape: TokenTape): boolean;
    /**
        Returns true only if no error tokens exist within the tape
        in neighborhood of other error tokens.
    */
    function noDupeErrors(tape: TokenTape): boolean;
    /**
        Returns true only if contents of string and indexes arrays are consistent.
    */
    function stringsOk(tape: TokenTape): boolean;
    /**
        Returns true only if all tokens of the tape
        parse into themselves when fed to the tokenizer.
    */
    function recursiveOk(tape: TokenTape): boolean;
    /**
        Returns true only if contents of tape strings sum up to the original input string.
    */
    function stringSumOk(tape: TokenTape, originalInput: string): boolean;
    /**
        Returns true only if original input yields exactly tape when tokenized again
    */
    function tokenizeAgainOk(tape: TokenTape, originalInput: string): boolean;
}
//# sourceMappingURL=lexer_debug.d.ts.map