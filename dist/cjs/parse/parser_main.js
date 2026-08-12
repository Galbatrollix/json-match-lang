"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExpressionTokens = parseExpressionTokens;
const parser_preprocess_ts_1 = require("./parser_preprocess.js");
//todo: go over lexer and maybe reorganize it so it makes more sense, update docstrings and
// names perhaps too
function parseExpressionTokens(tape) {
    // find any critical and easy to spot errors with supplied token tape
    const preprocessingErrors = (0, parser_preprocess_ts_1.preprocessFindInvalidTokens)(tape);
    if (preprocessingErrors) {
        return assembleParseResult(emptyCompiledExpression(), preprocessingErrors, []);
    }
    return assembleParseResult(emptyCompiledExpression(), [], []);
}
function emptyCompiledExpression() {
    return undefined;
}
/**
    Turns parse result parts and assembles them into final
    object and performs necessary freezing operations.

    Arrays given as parameters may be modified (frozen)
*/
function assembleParseResult(output, errors, warnings) {
    return {
        output: output,
        errors: Object.freeze(errors),
        warnings: Object.freeze(warnings),
    };
}
