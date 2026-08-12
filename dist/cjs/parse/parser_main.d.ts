import * as lexer from "./../lex/lexer_main.ts";
import { type ParseError } from "./parser_errors.ts";
import { type ParseWarning } from "./parser_warnings.ts";
export type CompiledExpression = undefined;
export type ParseResult = Readonly<{
    output: CompiledExpression;
    errors: Readonly<Array<ParseError>>;
    warnings: Readonly<Array<ParseWarning>>;
}>;
export declare function parseExpressionTokens(tape: lexer.TokenTape): ParseResult;
//# sourceMappingURL=parser_main.d.ts.map