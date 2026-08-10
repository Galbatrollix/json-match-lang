import {runAllFuzzTests} from "./fuzz/fuzz_main.test.ts"
import {runAllUnitTests} from "./unit/unit_main.test.ts"


import {lexer} from "./../main.ts"

runAllUnitTests();


const expr = `> THIS >> "is" > "a" > Pretty | Long > "expression" > string <<<> Long > is > a > good #-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0 > way > to > say > that & AND By The Way, there is some numbers for ya ey: #-3.1415E0, 1234124, #0.000000000000000000000000000001E00000000000000000000000000000000000000000001`;
const startTime = performance.now()

lexer.tokenizeMatchString(expr);

const endTime = performance.now()

console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)



runAllFuzzTests();