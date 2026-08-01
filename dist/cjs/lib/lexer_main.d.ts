import { TokenKind } from "./lexer_enum.ts";
export type JsonPathTokenized = {
    tokenKinds: Readonly<Array<TokenKind>>;
    tokenStrings: Readonly<Array<string>>;
};
export declare function tokenizeJsonPathString(input: string): Readonly<JsonPathTokenized>;
export declare function tokenizedPrettyPrint(tokenized: Readonly<JsonPathTokenized>): string;
//# sourceMappingURL=lexer_main.d.ts.map