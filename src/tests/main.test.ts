import {runAllFuzzTests} from "./fuzz/fuzz_main.test.ts"
import {runAllUnitTests} from "./unit/unit_main.test.ts"


import {lexer} from "./../main.ts"
import {parseExpressionTokens} from "./../parse/parser_main.ts"


runAllUnitTests();


//const expr = `> THIS >> "is" > "a" > Pretty | Long > "expression" > string <<<> Long > is > a > good #-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0 > way > to > say > that & AND By The Way, there is some numbers for ya ey: #-3.1415E0, 1234124, #0.000000000000000000000000000001E00000000000000000000000000000000000000000001`;
//const expr = `> THIS >> "is" > "a" > Pretty | Long > "expression" > string <<<> Long > is > a > good #-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0#-3.1415E0 > way > to > say > that & AND By The Way there is some numbers for ya ey #-3.1415E0 1234124 #0.000000000000000000000000000001E00000000000000000000000000000000000000000001`;
const expr1 = `>>> "dupa" | !"kupa" & lupa & !!(10 | 12) | #1235 ++<>`;
const expr2 = `><>(!"kiki")<>-+++ (!dupa)`
const expr3 = `#"kwaczka" >> dupa | kupa & siki | !czort <`
const expr4 = `> lupa | !!(dupa | siki)`
const expr5 = `!((!(!( dupa && {0}))))` // example for getting error emits right
const expr6 = `>>>>69<>>>> ++ ++*++ ++`
const expr7 = `1 | 2 | 3 | 5 & !6 | 8 & !#"dupa"`
const expr8 = `((dupa)) | siki`
const expr9 = `!((!(!!!( dupa & {0}))))` 
const expr10 = `meh & keh & (dupa &! kupa)`;
const expr11 = `(`.repeat(100000);

const expr12 = `dupa >> +  czort  !!!!!kupa  & dupa`;
const expr13 = `a | b | !!!( c | !!d | (1 | 2 & 3)) + #"s t r i n g" | #-3.13e1`
const expr = expr13
const startTime = performance.now()

const tokenized = lexer.tokenizeExpressionString(expr);
const parsed = parseExpressionTokens(tokenized);
// console.log(tokenized, parsed, lexer.TokenTapeUtils.Display.asStr(tokenized))
// console.log(parsed);
const endTime = performance.now()

console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)

// runAllFuzzTests();