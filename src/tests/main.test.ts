import {tokenizeJsonPathString, tokenizedPrettyPrint, TokenKind} from "../main.ts"

const dupa = "𝒳+😂+😂";
console.log(`Dupa length: ${dupa.length}`);

for (let c of dupa){
	console.log(c, c.length);
}

console.log("===================");
for(let i = 0; i<dupa.length; i++) {
	const c = dupa[i];
	console.log(c, c.length);
}
const h = TokenKind.isOperator(TokenKind.OPERATOR_NOT)
console.log("HAHAHAH ", h);
console.log(Array.from(dupa));

// const testt = "𝒳 12345 01 || + 😂+😂";
const testt = `"\\\\" #"\\"dupa\\"" 00 ++ --- 1000 333  0 {000} {0} {1334} [313] [0] [000] #-0.312341E+0000123 #0 #123.0 #0E123 |`
console.log(testt);
const result = tokenizeJsonPathString(testt);
console.log(result);
console.log(tokenizedPrettyPrint(result));