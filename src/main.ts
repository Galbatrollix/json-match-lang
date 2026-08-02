import {
	tokenizeString as _tokenizeString,
	type TokenTape as _TokenTape,
	tokenTapeUtils as _tokenTapeUtils,
} from "./lex/lexer_main.ts"

import {TokenKind as _TokenKind} from "./lex/lexer_enum.ts" 

export const tokenTapeUtils = _tokenTapeUtils;
export const tokenizeString = _tokenizeString;
export type TokenTape = _TokenTape;

export const TokenKind = _TokenKind;
export type TokenKind = _TokenKind;