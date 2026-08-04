// import {runAllFuzzTests} from "./fuzz/fuzz_main.test.ts"
import {runAllUnitTests} from "./unit/unit_main.test.ts"

import {lexer} from "./../main.ts"

runAllUnitTests();
const test_emtpy = '""';

console.log(lexer.tokenizeMatchString(test_emtpy));

//const testt = "𝒳 12345 01 || + 😂+😂";
//const testt = `}}}}}}}"\\\\" #"\\"du\npa\\"" "\\""00 aBBa dupa kupa213 ++ --- 1000 333  0 {000} {0} {1334} [313] [0] [000] #-0.312341E+0000123 #0 #123.0 #0E123 |`

// const testt = "dupa > kupa > {*} > [*] > #3154";
// console.log(testt);
// const result: lexer.TokenTape = lexer.tokenizeMatchString(testt);

// console.log(result);
// console.log(lexer.tapeUtils.display.asArr(result));
// console.log(lexer.tapeUtils.display.asStr(result));

// const schizo = "x" +"😂😂".slice(1,3) + "y";
// let dupa = ""
// for (const c of schizo){
// 	console.log(c);
// 	dupa += c;
// }
// console.log(dupa, dupa.length);
// const schizoTape = lexer.tokenizeMatchString(schizo);
// console.log(schizoTape);
// console.log(lexer.tapeUtils.display.asStr(schizoTape));

// console.log("Basic check: ", lexer.tapeUtils.debug.integrityCheckDeep(result));
// console.log("Basic check: ", lexer.tapeUtils.debug.integrityCheckDeep(schizoTape));
// console.log("Basic check: ", lexer.tapeUtils.debug.integrityCheckDeep(lexer.tokenizeMatchString(" ")));


// const temp = " ";
// const tempResult = lexer.tokenizeMatchString(temp);
// console.log(tempResult);
// console.log(lexer.tapeUtils.display.asArr(tempResult));
// console.log("Deep check: ", lexer.tapeUtils.debug.integrityCheckFull(tempResult, temp));
// console.log("Deep check: ", lexer.tapeUtils.debug.integrityCheckFull(result, testt));
// console.log("Deep check: ", lexer.tapeUtils.debug.integrityCheckFull(schizoTape, schizo));



