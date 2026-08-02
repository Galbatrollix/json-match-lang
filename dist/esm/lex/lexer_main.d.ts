import { TokenKind } from "./lexer_enum.ts";
/**
    Immutable output of json match string tokenizer.
    SoA of two arrays with length equal to value TokenTape.length property:
        tokenKinds:   TokenKind enum values representing consecutive token types
        tokenStrings: Strings sliced from original input, that span entire range of each token
    tokenStrings.join("") must be equal to original string input.
*/
export type TokenTape = Readonly<{
    length: Readonly<number>;
    tokenKinds: Readonly<Array<TokenKind>>;
    tokenStrings: Readonly<Array<string>>;
}>;
export declare function tokenizeString(input: string): TokenTape;
/**
    Bundle of utility functions for handling TokenTape values.
*/
export declare namespace tokenTapeUtils {
    /**
        Contains functions for data presentation
        purposes only.
    */
    namespace display {
        /**
            Returns token tape encoded as array of strings, with each
            string corresponding to one tokentape entry.
        */
        function asArr(tape: TokenTape): Array<string>;
        /**
            Returns token tape encoded as a single string with line
            separators. Mainly for printing in console.
        */
        function asStr(tape: TokenTape): string;
    }
}
//# sourceMappingURL=lexer_main.d.ts.map