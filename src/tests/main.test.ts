import {tokenizeJsonPathString, tokenizedPrettyPrint, TokenKind} from "../main.ts"


// const testt = "𝒳 12345 01 || + 😂+😂";
const testt = `}}}}}}}"\\\\" #"\\"dupa\\"" 00 aBBa dupa kupa213 ++ --- 1000 333  0 {000} {0} {1334} [313] [0] [000] #-0.312341E+0000123 #0 #123.0 #0E123 |`
console.log(testt);
const result = tokenizeJsonPathString(testt);
console.log(result);
console.log(tokenizedPrettyPrint(result));