"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExpressionTokens = parseExpressionTokens;
const lexer = __importStar(require("./../lex/lexer_main.js"));
const parser_errors_ts_1 = require("./parser_errors.js");
const parser_preprocess_ts_1 = require("./parser_preprocess.js");
const parser_impl_ts_1 = require("./parser_impl.js");
const parser_types_ts_1 = require("./parser_types.js");
const parser_postprocess_ts_1 = require("./parser_postprocess.js");
//todo: go over lexer and maybe reorganize it so it makes more sense, update docstrings and
// names perhaps too
function parseExpressionTokens(lexTape) {
    // find any critical and easy to spot errors with supplied token lexTape
    const preprocessingErrors = (0, parser_preprocess_ts_1.preprocessFindInvalidTokens)(lexTape);
    if (preprocessingErrors.length) {
        return assembleParseResult(emptyCompiledExpression(), preprocessingErrors);
    }
    const filterResult = (0, parser_preprocess_ts_1.preprocessFilterWhitespace)(lexTape);
    const filteredTokens = filterResult.tokens;
    const originalIndexMapping = filterResult.mapping;
    const parseOutput = (0, parser_impl_ts_1.generateExpressionParseTape)(filteredTokens);
    const parseTape = parseOutput.parseTape;
    const incompleteErrors = parseOutput.errors;
    const errors = (0, parser_errors_ts_1.parseErrorsFromIncomplete)(incompleteErrors, originalIndexMapping);
    console.log(errors);
    console.log(lexer.TokenTapeUtils.Display.asStr(lexTape));
    if (errors.length) {
        return assembleParseResult(emptyCompiledExpression(), errors);
    }
    ;
    // TODO: HERE COLLECT WARNINGS FROM RAW AST
    console.log(parser_types_ts_1.ExpressionParseTapeUtils.Display.asTreeFull(parseTape, lexTape.tokenString, originalIndexMapping));
    (0, parser_postprocess_ts_1.postprocessCollapseTreesInPlace)(parseTape);
    console.log(parser_types_ts_1.ExpressionParseTapeUtils.Display.asTreeFull(parseTape, lexTape.tokenString, originalIndexMapping));
    // todo: postprocess errors to transform the filtered token indexes 
    // into original token indexes
    return assembleParseResult(emptyCompiledExpression(), errors);
}
function emptyCompiledExpression() {
    return undefined;
}
/**
    Turns parse result parts and assembles them into final
    object and performs necessary freezing operations.

    Arrays given as parameters may be modified (frozen)
*/
function assembleParseResult(output, errors) {
    return {
        output: output,
        errors: Object.freeze(errors),
    };
}
