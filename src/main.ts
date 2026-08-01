import {
	tokenizeJsonPathString as tok,
	type JsonPathTokenized as ptk,
	tokenizedPrettyPrint as tpp,
} from "./lib/lexer_main.ts"

import {TokenKind as TK} from "./lib/lexer_enum.ts" 

export const  tokenizedPrettyPrint = tpp;
export const tokenizeJsonPathString = tok;
export type JsonPathTokenized = ptk;

export const TokenKind = TK;
export type TokenKind = TK;