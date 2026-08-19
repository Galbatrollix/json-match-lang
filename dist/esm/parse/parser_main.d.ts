import * as lexer from "./../lex/lexer_a_index.ts";
import { type ParseError } from "./parser_errors.ts";
import { type ExpressionParseTape } from "./parser_types.ts";
export type ParseResult = Readonly<{
    parseTape: ExpressionParseTape;
    errors: Readonly<Array<ParseError>>;
}>;
export declare function parseExpressionTokens(lexTape: lexer.TokenTape): ParseResult;
//# sourceMappingURL=parser_main.d.ts.map