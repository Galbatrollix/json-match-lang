"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExpressionTokens = parseExpressionTokens;
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
    const parseOutput = (0, parser_impl_ts_1.generateRawExpressionParseTape)(filteredTokens);
    const parseTape = parseOutput.parseTape;
    const incompleteErrors = parseOutput.errors;
    const errors = (0, parser_errors_ts_1.parseErrorsFromIncomplete)(incompleteErrors, originalIndexMapping);
    if (errors.length) {
        return assembleParseResult(emptyCompiledExpression(), errors);
    }
    ;
    console.log(parser_types_ts_1.RawExpressionParseTapeUtils.Display.asTreeFull(parseTape, lexTape.tokenString, originalIndexMapping));
    (0, parser_postprocess_ts_1.postprocessCollapseTreesInPlace)(parseTape);
    console.log(parser_types_ts_1.RawExpressionParseTapeUtils.Display.asTreeFull(parseTape, lexTape.tokenString, originalIndexMapping));
    // transform converts type of parseTape 
    //      from RawExpressionParseTape to ExpressionParseTape
    // previous item is invalidated and converted in place, hence:
    //      the hard type cast is necessary
    (0, parser_postprocess_ts_1.postprocessTransformRawTapeToFinal)(parseTape, originalIndexMapping);
    const parseTapeResult = parseTape;
    console.log(parser_types_ts_1.ExpressionParseTapeUtils.Display.asTree(parseTapeResult, lexTape, true));
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
