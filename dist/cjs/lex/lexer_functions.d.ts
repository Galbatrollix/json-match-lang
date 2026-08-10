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
    const lexWildcardAll: LexFunction;
    const lexParenthesisLeft: LexFunction;
    const lexParenthesisRight: LexFunction;
    const lexWildcardArray: LexFunction;
    const lexWildcardObject: LexFunction;
    const lexValueTypeWildcard: LexFunction;
    const lexValueTypeString: LexFunction;
    const lexValueTypeNumber: LexFunction;
    const lexValueTypeBoolean: LexFunction;
    const lexValueExactNull: LexFunction;
    const lexValueExactTrue: LexFunction;
    const lexValueExactFalse: LexFunction;
    const lexValueTypeArray: LexFunction;
    const lexValueTypeObject: LexFunction;
    const lexWhitespace: LexFunction;
    const lexKeyNaked: LexFunction;
    const lexIndexAll: LexFunction;
    const lexIndexArray: LexFunction;
    const lexIndexObject: LexFunction;
    const lexKeyQuoted: LexFunction;
    const lexValueExactString: LexFunction;
    const lexValueExactNumber: LexFunction;
    /**
        Incomplete error functions currently utilize a hacky approach
        which kind-of hardcodes end of string into alternative imeplementations
        of lex functions. It is correct but revolves around code repetition.

        Best solution would most likely be: each function when failing
        returns how many characters it reached before determining it doesnt match.
        This can be easily chained and can be decoded at the end to check whether
        function hit end of file or not. That would require modifying all lexers
        and combinators to work though.
    */
    const lexErrorIncompleteKey: LexFunction;
    const lexErrorIncompleteValue: LexFunction;
    const lexErrorIncompleteArray: LexFunction;
    const lexErrorIncompleteObject: LexFunction;
    function lexError(charList: Array<string>, start: number, end: number): [number, boolean];
}
//# sourceMappingURL=lexer_functions.d.ts.map