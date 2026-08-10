export declare enum ErrorKind {
    FOUND_ERROR_TOKENS = 0,
    INDEX_OUT_OF_BOUNDS = 1,
    STRING_NOT_VALID_JSON = 2
}
/**
    Reported when token tape given as input to the parser
    has erorr (or incomplete error) tokens.
    
    tokenIndexes array points to all detected error tokens in the tape.
*/
export type ErrorFoundErrorTokens = {
    kind: ErrorKind.FOUND_ERROR_TOKENS;
    tokenIndexes: Readonly<Array<number>>;
};
/**
    Reported when token tape given as input to the parser
    has index match tokens that exceed maximum permitted value.
    
    tokenIndexes array points to all detected invalid index tokens in the tape.
*/
export type ErrorIndexOutOfBounds = {
    kind: ErrorKind.INDEX_OUT_OF_BOUNDS;
    tokenIndexes: Readonly<Array<number>>;
};
/**
    Reported when token tape given as input to the parser
    has index match tokens that exceed maximum permitted value.
    
    tokenIndexes array points to all detected invalid index tokens in the tape.
*/
export type ErrorStringNotValidJson = {
    kind: ErrorKind.STRING_NOT_VALID_JSON;
    tokenIndexes: Readonly<Array<number>>;
};
/**
    Tagged union of all error types,
    uses field (kind: ErrorKind) as union discriminator.
*/
export type Error = Readonly<ErrorFoundErrorTokens | ErrorIndexOutOfBounds | ErrorStringNotValidJson>;
//# sourceMappingURL=parser_errors.d.ts.map