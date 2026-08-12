import { TokenKind } from "./lexer_enum.ts";
export type MatchToken = {
    kind: TokenKind;
    endIdx: number;
};
/**
    Takes json match string split into sequence of codepoints as an argument
    Returns a array of MatchTokens corresponding to the given sequence.
    Cannot fail, an exception or returning anything else than a (possibly empty)
    array means that there was a bug.

    Result is always at least 1 item long, as the function
    prepends a dummy element to the result.
    Dummy element is of kind WHITESPACE and its endIdx is always 0.
*/
export declare function lexExpressionCodepoints(characterList: Array<string>): Array<MatchToken>;
//# sourceMappingURL=lexer_impl.d.ts.map