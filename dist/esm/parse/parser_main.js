import * as lexer from "./../lex/lexer_main.js";
import { parseErrorsFromIncomplete, } from "./parser_errors.js";
import { preprocessFindInvalidTokens, preprocessFilterWhitespace, } from "./parser_preprocess.js";
import { generateExpressionParseTape } from "./parser_impl.js";
import { ExpressionParseTapeUtils, } from "./parser_types.js";
import { postprocessCollapseTreesInPlace } from "./parser_postprocess.js";
//todo: go over lexer and maybe reorganize it so it makes more sense, update docstrings and
// names perhaps too
export function parseExpressionTokens(lexTape) {
    // find any critical and easy to spot errors with supplied token lexTape
    const preprocessingErrors = preprocessFindInvalidTokens(lexTape);
    if (preprocessingErrors.length) {
        return assembleParseResult(emptyCompiledExpression(), preprocessingErrors);
    }
    const filterResult = preprocessFilterWhitespace(lexTape);
    const filteredTokens = filterResult.tokens;
    const originalIndexMapping = filterResult.mapping;
    const parseOutput = generateExpressionParseTape(filteredTokens);
    const parseTape = parseOutput.parseTape;
    const incompleteErrors = parseOutput.errors;
    const errors = parseErrorsFromIncomplete(incompleteErrors, originalIndexMapping);
    console.log(errors);
    console.log(lexer.TokenTapeUtils.Display.asStr(lexTape));
    if (errors.length) {
        return assembleParseResult(emptyCompiledExpression(), errors);
    }
    ;
    // TODO: HERE COLLECT WARNINGS FROM RAW AST
    console.log(ExpressionParseTapeUtils.Display.asTreeFull(parseTape, lexTape.tokenString, originalIndexMapping));
    postprocessCollapseTreesInPlace(parseTape);
    console.log(ExpressionParseTapeUtils.Display.asTreeFull(parseTape, lexTape.tokenString, originalIndexMapping));
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
