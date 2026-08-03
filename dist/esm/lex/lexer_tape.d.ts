import { TokenKind } from "./lexer_enum.ts";
/**
    Immutable output of json match string tokenizer.
    SoA of 4 arrays with .length equal to TokenTape.tokenCount property:
        tokenKind[i]:   TokenKind enum value representing i-th token type
        tokenString[i]: String sliced from original input, that spans range of i-th token
        startIdx[i]:     Char index of original input where i-th token starts
        endIdx[i]:       Char index of original input where i-th token ends, plus one

    This always is true: with TokenTape as "tt":
        originalInput.slice(tt.startIdx[i], tt.endIdx[i]) === tt.tokenString[i]
        tt.tokenString.join("") === originalInput
        0 <= tt.startIdx[i] <= originalInput.length
        0 <= tt.endIdx[i]   <= originalInput.length
        tt.startIdx[i] === tt.endIdx[i-1]  (for i > 0)
    Char index refers to index in JS string not to code point in unicode sequence.
*/
export type TokenTape = Readonly<{
    tokenCount: Readonly<number>;
    tokenKind: Readonly<Array<TokenKind>>;
    tokenString: Readonly<Array<string>>;
    startIdx: Readonly<Array<number>>;
    endIdx: Readonly<Array<number>>;
}>;
export declare function tokenizeMatchString(input: string): TokenTape;
/**
    Bundle of utility functions for handling TokenTape values.
*/
export declare namespace utils {
    namespace misc {
        /**
        Returns true if TokenTape has at least one error token.
        Otherwise returns false.
    */
        function hasError(tape: TokenTape): boolean;
        /**
            Returns true only if given token tapes are identical
        */
        function equals(t1: TokenTape, t2: TokenTape): boolean;
    }
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
        function asHtml(tape: TokenTape): string;
    }
}
//# sourceMappingURL=lexer_tape.d.ts.map