import { TokenKind } from "./lexer_enum.ts";
export type PathToken = {
    kind: TokenKind;
    endIdx: number;
};
export declare function lexJsonPathString(characterList: Array<string>): Array<PathToken>;
//# sourceMappingURL=lexer_impl.d.ts.map