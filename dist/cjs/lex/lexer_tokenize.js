"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenizeExpressionString = tokenizeExpressionString;
const lexer_impl_ts_1 = require("./lexer_impl.js");
function tokenizeExpressionString(input) {
    //codepoints are not always length one, cuz surrogate pairs!
    const codepointList = Array.from(input);
    const lexerOutput = (0, lexer_impl_ts_1.lexExpressionCodepoints)(codepointList);
    return assembleTokenTape(lexerOutput, codepointList);
}
function assembleTokenTape(lexerOutput, codepointList) {
    const resultKinds = [];
    const resultStrings = [];
    for (let i = 1; i < lexerOutput.length; i++) {
        const startIdx = lexerOutput[i - 1].endIdx;
        const endIdx = lexerOutput[i].endIdx;
        const kind = lexerOutput[i].kind;
        const tokenSlice = codepointList.slice(startIdx, endIdx);
        const tokenString = tokenSlice.join("");
        resultKinds.push(kind);
        resultStrings.push(tokenString);
    }
    // constructing output
    const result = {
        tokenCount: lexerOutput.length - 1,
        tokenKind: Object.freeze(resultKinds),
        tokenString: Object.freeze(resultStrings),
    };
    return Object.freeze(result);
}
