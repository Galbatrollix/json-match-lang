/**
    Exported namespace "funcs" with lex functions is at the end of the file.
*/
/**
    A function type representing a lexer component.
    A conforming function attempts to parse some kind of character
    sequence in charList, starting from index start and ending before
    index end.
    
    first return - consumed - is count of consumed characters on lexer match,
    second return - matched - is true if lex matched or false otherwise

    Constraints:
        start <= end
        end <= charList.length
        start >= 0
        consumed <= end - start
*/
export type LexFunction = (charList: Array<string>, start: number, end: number) => [consumed: number, matched: boolean];
/**
    Similar to matchString, except it matches only incomplete strings -
    that is strings that have opening quote and do not run into
    closing qote before running out of characters in charList.

    Will throw error if it matches a complete string. It should be called
    after the normal string function determined there is no complete string match.
*/
declare function matchIncompleteString(charList: Array<string>, start: number, end: number): [number, boolean];
export declare namespace funcs {
    const lexOperatorChild: LexFunction;
    const lexOperatorParent: LexFunction;
    const lexOperatorSiblingNext: LexFunction;
    const lexOperatorSiblingPrev: LexFunction;
    const lexOperatorSiblingSubsequent: LexFunction;
    const lexOperatorSiblingPreceding: LexFunction;
    const lexOperatorSiblingAny: LexFunction;
    const lexOperatorOr: LexFunction;
    const lexOperatorAnd: LexFunction;
    const lexOperatorNot: LexFunction;
    const lexMatchWildcardAll: LexFunction;
    const lexParenthesisLeft: LexFunction;
    const lexParenthesisRight: LexFunction;
    const lexMatchWildcardArray: LexFunction;
    const lexMatchWildcardObject: LexFunction;
    const lexPrimitiveKindWildcard: LexFunction;
    const lexPrimitiveKindString: LexFunction;
    const lexPrimitiveKindNumber: LexFunction;
    const lexPrimitiveKindBoolean: LexFunction;
    const lexPrimitiveNull: LexFunction;
    const lexPrimitiveTrue: LexFunction;
    const lexPrimitiveFalse: LexFunction;
    const lexWhitespace: LexFunction;
    const lexMatchKeyNaked: LexFunction;
    const lexMatchIndexAll: LexFunction;
    const lexMatchIndexArray: LexFunction;
    const lexMatchIndexObject: LexFunction;
    const lexMatchKey: LexFunction;
    const lexPrimitiveString: LexFunction;
    const lexPrimitiveNumber: LexFunction;
    const lexErrorIncompleteKey: typeof matchIncompleteString;
    const lexErrorIncompletePrimitive: LexFunction;
    function lexError(charList: Array<string>, start: number, end: number): [number, boolean];
}
export {};
//# sourceMappingURL=lexer_functions.d.ts.map