import * as lexer from "./../lex/lexer_main.js";
import {} from "./parser_errors.js";
import {} from "./parser_warnings.js";
import { preprocessFindInvalidTokens } from "./parser_preprocess.js";
export function parseExpressionTokens(tape) {
    preprocessFindInvalidTokens(tape);
    return {
        ast: undefined,
        warnings: [],
        errors: [],
    };
}
