/**
    Enum of ParseError union discriminators
    each entry in the enum corresponds with
    a specific ParseError variant.
*/
export declare enum ParseErrorKind {
    FOUND_ERROR_TOKENS = 0,
    INDEX_OUT_OF_BOUNDS = 1,
    STRING_NOT_VALID_JSON = 2
}
/**
    This namespace contains types for all specific variants of
    ParseError. Each variant has a corresponding ParseErrorKind
    value as a discriminator.
*/
export declare namespace ParseErrorVariants {
    /**
        Reported when token tape given as input to the parser
        has erorr (or incomplete error) tokens.
        
        tokenIndexes array points to all detected error tokens in the tape.
    */
    type FoundErrorTokens = {
        kind: ParseErrorKind.FOUND_ERROR_TOKENS;
        tokenIndexes: Readonly<Array<number>>;
    };
    /**
        Reported when token tape given as input to the parser
        has index match tokens that exceed maximum permitted value.
        
        tokenIndexes array points to all detected invalid index tokens in the tape.
    */
    type IndexOutOfBounds = {
        kind: ParseErrorKind.INDEX_OUT_OF_BOUNDS;
        tokenIndexes: Readonly<Array<number>>;
    };
    /**
        Reported when token tape given as input to the parser
        has index match tokens that exceed maximum permitted value.
        
        tokenIndexes array points to all detected invalid index tokens in the tape.
    */
    type StringNotValidJson = {
        kind: ParseErrorKind.STRING_NOT_VALID_JSON;
        tokenIndexes: Readonly<Array<number>>;
    };
}
/**
    Tagged union of all error types,
    uses field (kind: ParseErrorKind) as union discriminator.
*/
export type ParseError = Readonly<ParseErrorVariants.FoundErrorTokens | ParseErrorVariants.IndexOutOfBounds | ParseErrorVariants.StringNotValidJson>;
//# sourceMappingURL=parser_errors.d.ts.map