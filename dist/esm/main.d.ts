import { tokenizeJsonPathString as tok, type JsonPathTokenized as ptk, tokenizedPrettyPrint as tpp } from "./lib/lexer_main.ts";
import { TokenKind as TK } from "./lib/lexer_enum.ts";
export declare const tokenizedPrettyPrint: typeof tpp;
export declare const tokenizeJsonPathString: typeof tok;
export type JsonPathTokenized = ptk;
export declare const TokenKind: typeof TK;
export type TokenKind = TK;
//# sourceMappingURL=main.d.ts.map