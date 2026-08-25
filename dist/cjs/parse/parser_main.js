"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExpressionTokens = parseExpressionTokens;
const parser_errors_ts_1 = require("./parser_errors.js");
const parser_preprocess_ts_1 = require("./parser_preprocess.js");
const parser_impl_ts_1 = require("./parser_impl.js");
const parser_postprocess_ts_1 = require("./parser_postprocess.js");
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
    // rawParseTape variable is no longer valid beyond this point.
    const parseTape = (0, parser_postprocess_ts_1.postprocessTransformRawTapeToFinal)(rawParseTape, originalIndexMapping);
    return assembleParseResult(parseTape, []);
}
/**
    Assembles a new, empty parse tape to return alongside
    fatal errors.
*/
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
    return Object.freeze({
        parseTape: output,
        errors: Object.freeze(errors),
    });
}
