import {tokenizeString, type TokenTape, tokenTapeUtils} from "../main.ts"


const testt = "𝒳 12345 01 || + 😂+😂";
//const testt = `}}}}}}}"\\\\" #"\\"du\npa\\"" "\\""00 aBBa dupa kupa213 ++ --- 1000 333  0 {000} {0} {1334} [313] [0] [000] #-0.312341E+0000123 #0 #123.0 #0E123 |`
console.log(testt);
const result: TokenTape = tokenizeString(testt);

console.log(result);
console.log(tokenTapeUtils.display.asArr(result));
console.log(tokenTapeUtils.display.asStr(result));

const schizo = "x" +"😂😂".slice(1,3) + "y";
let dupa = ""
for (const c of schizo){
	console.log(c);
	dupa += c;
}
console.log(dupa, dupa.length);