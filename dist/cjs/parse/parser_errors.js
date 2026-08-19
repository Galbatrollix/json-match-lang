"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseErrorKind = void 0;
exports.parseErrorsFromIncomplete = parseErrorsFromIncomplete;
/**
    Enum of ParseError union discriminators
    each entry in the enum corresponds with
    a specific ParseError variant.
*/
var ParseErrorKind;
(function (ParseErrorKind) {
    ParseErrorKind[ParseErrorKind["FOUND_ERROR_TOKENS"] = 0] = "FOUND_ERROR_TOKENS";
    ParseErrorKind[ParseErrorKind["INDEX_OUT_OF_BOUNDS"] = 1] = "INDEX_OUT_OF_BOUNDS";
    ParseErrorKind[ParseErrorKind["STRING_NOT_VALID_JSON"] = 2] = "STRING_NOT_VALID_JSON";
    ParseErrorKind[ParseErrorKind["STACK_OVERFLOW"] = 3] = "STACK_OVERFLOW";
    ParseErrorKind[ParseErrorKind["WRONG_SYNTAX"] = 4] = "WRONG_SYNTAX";
})(ParseErrorKind || (exports.ParseErrorKind = ParseErrorKind = {}));
/**
    Transforms an incomplete errors array into a proper parse error instances
    via inverse index mapping from filtered to original token tape tokens.
*/
function parseErrorsFromIncomplete(incomplete, tokenMapping) {
    const result = new Array(incomplete.length);
    for (let errIdx = 0; errIdx < incomplete.length; errIdx++) {
        const err = incomplete[errIdx];
        const indexCount = err.filteredTokenIndexes.length;
        const indexesCorrect = new Array(indexCount);
        for (let i = 0; i < indexCount; i++) {
            indexesCorrect[i] = tokenMapping[err.filteredTokenIndexes[i]];
        }
        const properError = {
            kind: err.targetKind,
            tokenIndexes: indexesCorrect,
        };
        result[errIdx] = Object.freeze(properError);
    }
    return result;
}
