import {tokenizeString, type TokenTape, tokenTapeUtils} from "../main.ts"
import {debug} from "../lex/lexer_debug.ts"

//const testt = "𝒳 12345 01 || + 😂+😂";
const testt = `}}}}}}}"\\\\" #"\\"du\npa\\"" "\\""00 aBBa dupa kupa213 ++ --- 1000 333  0 {000} {0} {1334} [313] [0] [000] #-0.312341E+0000123 #0 #123.0 #0E123 |`
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
const schizoTape = tokenizeString(schizo);
console.log(schizoTape);
console.log(tokenTapeUtils.display.asStr(schizoTape));

console.log("Basic check: ", debug.integrityCheckDeep(result));
console.log("Basic check: ", debug.integrityCheckDeep(schizoTape));
console.log("Basic check: ", debug.integrityCheckDeep(tokenizeString(" ")));


const temp = " ";
const tempResult = tokenizeString(temp);
console.log(tempResult);
console.log(tokenTapeUtils.display.asArr(tempResult));
console.log("Deep check: ", debug.integrityCheckFull(tempResult, temp));
console.log("Deep check: ", debug.integrityCheckFull(result, testt));
console.log("Deep check: ", debug.integrityCheckFull(schizoTape, schizo));

