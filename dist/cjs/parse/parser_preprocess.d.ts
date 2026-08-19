import * as lexer from "./../lex/lexer_a_index.ts";
import { type ParseError } from "./parser_errors.ts";
/**
    A parser preprocessing function that scans token tape for critical problems
    with supplied tokens such as:
        - presence of error tokens
        - out of range index tokens
        - ill-formed strings (not json conformant)
    Returns an array of all errors that were found.
    If no error was found, empty array is returned.
*/
export declare function preprocessFindInvalidTokens(tape: lexer.TokenTape): Array<ParseError>;
/**
    Parser preprocessing function that based on lexer.TokenTape
    makes a new array of tokens with whitespace filtered.

    Returns new array with whitespace filtered and mapping
    that maps indexes in filtered array to indexes in original TokenTape.
*/
export declare function preprocessFilterWhitespace(tape: lexer.TokenTape): {
    tokens: Array<lexer.TokenKind>;
    mapping: Array<number>;
};
//# sourceMappingURL=parser_preprocess.d.ts.map