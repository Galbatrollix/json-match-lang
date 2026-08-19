import * as lexer from "./../lex/lexer_a_index.ts";
import { type RawExpressionParseTape } from "./parser_types.ts";
import { type IncompleteParseError } from "./parser_errors.ts";
/**
    Generates expression parse tape from array of tokens
    without erros and with whitespaces filtered out.

    If syntax erorr was encountered during parsing, function returns
    a partial result and returns errors via errors array alongside partial result.

    If tokens were parsed properly, errors will be an empty array
    and parseTape will contain a complete result.
*/
export declare function generateRawExpressionParseTape(filteredTokens: Readonly<Array<lexer.TokenKind>>): {
    parseTape: RawExpressionParseTape;
    errors: Array<IncompleteParseError>;
};
//# sourceMappingURL=parser_impl.d.ts.map