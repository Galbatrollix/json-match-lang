import {tokenizeJsonPathString as TK, type PathToken as PT} from "./lib/lexer.ts"

export const tokenizeJsonPathString = TK;
export type PathToken = PT;