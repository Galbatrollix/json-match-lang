"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExpressionTokens = parseExpressionTokens;
const parser_preprocess_ts_1 = require("./parser_preprocess.js");
function parseExpressionTokens(tape) {
    (0, parser_preprocess_ts_1.preprocessFindInvalidTokens)(tape);
    return {
        ast: undefined,
        warnings: [],
        errors: [],
    };
}
