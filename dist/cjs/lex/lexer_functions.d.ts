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
    const lexMatchWildcardAll: LexFunction;
    const lexMatchWildcardArray: LexFunction;
    const lexMatchWildcardObject: LexFunction;
    const lexPrimitiveKindWildcard: LexFunction;
    const lexPrimitiveKindString: LexFunction;
    const lexPrimitiveKindNumber: LexFunction;
    const lexPrimitiveKindBoolean: LexFunction;
    const lexPrimitiveNull: LexFunction;
    const lexPrimitiveTrue: LexFunction;
    const lexPrimitiveFalse: LexFunction;
    function lexWhitespace(charList: Array<string>, start: number, end: number): [number, boolean];
    function lexMatchKeyNaked(charList: Array<string>, start: number, end: number): [number, boolean];
    function lexMatchIndexAll(charList: Array<string>, start: number, end: number): [number, boolean];
    function lexMatchIndexArray(charList: Array<string>, start: number, end: number): [number, boolean];
    function lexMatchIndexObject(charList: Array<string>, start: number, end: number): [number, boolean];
    function lexMatchKey(charList: Array<string>, start: number, end: number): [number, boolean];
    function lexPrimitiveString(charList: Array<string>, start: number, end: number): [number, boolean];
    function lexPrimitiveNumber(charList: Array<string>, start: number, end: number): [number, boolean];
    function lexError(charList: Array<string>, start: number, end: number): [number, boolean];
}
//# sourceMappingURL=lexer_functions.d.ts.map