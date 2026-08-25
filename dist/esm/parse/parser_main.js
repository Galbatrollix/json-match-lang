import * as lexer from "./../lex/lexer_a_index.js";
import { parseErrorsFromIncomplete, } from "./parser_errors.js";
import { preprocessFindInvalidTokens, preprocessFilterWhitespace, } from "./parser_preprocess.js";
import { generateRawExpressionParseTape } from "./parser_impl.js";
import {} from "./parser_types.js";
import { postprocessCollapseTreesInPlace, postprocessTransformRawTapeToFinal, } from "./parser_postprocess.js";
export function parseExpressionTokens(lexTape) {
    // find any critical and easy to spot errors with supplied token lexTape
    const preprocessingErrors = preprocessFindInvalidTokens(lexTape);
    if (preprocessingErrors.length) {
        return assembleParseResult(emptyParseTape(), preprocessingErrors);
    }
    const filterResult = preprocessFilterWhitespace(lexTape);
    const filteredTokens = filterResult.tokens;
    const originalIndexMapping = filterResult.mapping;
    const parseOutput = generateRawExpressionParseTape(filteredTokens);
    const rawParseTape = parseOutput.parseTape;
    const incompleteErrors = parseOutput.errors;
    const errors = parseErrorsFromIncomplete(incompleteErrors, originalIndexMapping);
    if (errors.length) {
        return assembleParseResult(emptyParseTape(), errors);
    }
    ;
    postprocessCollapseTreesInPlace(rawParseTape);
    // transform converts type of rawParseTape 
    //      from RawExpressionParseTape to ExpressionParseTape
    // rawParseTape variable is no longer valid beyond this point.
    const parseTape = postprocessTransformRawTapeToFinal(rawParseTape, originalIndexMapping);
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
