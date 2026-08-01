import {tokenizeJsonPathString as tokenize, type PathToken as pathtk} from "./lib/lexer_impl.ts"
import {TokenKind as TK} from "./lib/lexer_enum.ts" 

export const tokenizeJsonPathString = tokenize;
export type PathToken = pathtk;

export const TokenKind = TK;
export type TokenKind = TK;