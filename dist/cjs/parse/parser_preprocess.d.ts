import * as lexer from "./../lex/lexer_main.ts";
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
//# sourceMappingURL=parser_preprocess.d.ts.map