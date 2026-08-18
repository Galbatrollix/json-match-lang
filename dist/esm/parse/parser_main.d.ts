import * as lexer from "./../lex/lexer_main.ts";
import { type ParseError } from "./parser_errors.ts";
export type CompiledExpression = undefined;
export type ParseResult = Readonly<{
    output: CompiledExpression;
    errors: Readonly<Array<ParseError>>;
}>;
export declare function parseExpressionTokens(lexTape: lexer.TokenTape): ParseResult;
//# sourceMappingURL=parser_main.d.ts.map