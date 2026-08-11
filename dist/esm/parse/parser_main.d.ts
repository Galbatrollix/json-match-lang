import * as lexer from "./../lex/lexer_main.ts";
import { type ParseError } from "./parser_errors.ts";
import { type ParseWarning } from "./parser_warnings.ts";
export type ExpressionAst = undefined;
export type ParseResult = {
    ast: ExpressionAst;
    warnings: Array<ParseWarning>;
    errors: Array<ParseError>;
};
export declare function parseExpressionTokens(tape: lexer.TokenTape): ParseResult;
//# sourceMappingURL=parser_main.d.ts.map