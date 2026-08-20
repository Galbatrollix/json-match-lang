"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExpressionTokens = parseExpressionTokens;
const parser_errors_ts_1 = require("./parser_errors.js");
const parser_preprocess_ts_1 = require("./parser_preprocess.js");
const parser_impl_ts_1 = require("./parser_impl.js");
const parser_postprocess_ts_1 = require("./parser_postprocess.js");
//todo: go over lexer and maybe reorganize it so it makes more sense, update docstrings and
// names perhaps too
function parseExpressionTokens(lexTape) {
    // find any critical and easy to spot errors with supplied token lexTape
    const preprocessingErrors = (0, parser_preprocess_ts_1.preprocessFindInvalidTokens)(lexTape);
    if (preprocessingErrors.length) {
        return assembleParseResult(emptyParseTape(), preprocessingErrors);
    }
    const filterResult = (0, parser_preprocess_ts_1.preprocessFilterWhitespace)(lexTape);
    const filteredTokens = filterResult.tokens;
    const originalIndexMapping = filterResult.mapping;
    const parseOutput = (0, parser_impl_ts_1.generateRawExpressionParseTape)(filteredTokens);
    const rawParseTape = parseOutput.parseTape;
    const incompleteErrors = parseOutput.errors;
    const errors = (0, parser_errors_ts_1.parseErrorsFromIncomplete)(incompleteErrors, originalIndexMapping);
    if (errors.length) {
        return assembleParseResult(emptyParseTape(), errors);
    }
    ;
    (0, parser_postprocess_ts_1.postprocessCollapseTreesInPlace)(rawParseTape);
    // transform converts type of rawParseTape 
    //      from RawExpressionParseTape to ExpressionParseTape
    // previous item is invalidated and converted in place, hence:
    //      the hard type cast is necessary
    (0, parser_postprocess_ts_1.postprocessTransformRawTapeToFinal)(rawParseTape, originalIndexMapping);
    const parseTape = rawParseTape;
    return assembleParseResult(parseTape, []);
}
function emptyParseTape() {
    return Object.freeze({
        pairCount: 0,
        combinators: Object.freeze([]),
        constraints: Object.freeze([]),
    });
}
/**
    Turns parse result parts and assembles them into final
    object and performs necessary freezing operations.

    Arrays given as parameters may be modified (frozen)
*/
function assembleParseResult(output, errors) {
    return {
        parseTape: output,
        errors: Object.freeze(errors),
    };
}
