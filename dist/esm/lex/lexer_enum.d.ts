/**
    All them types of tokens that lexing json path can possibly output.
    (...) means this is an example not the only possible value of the token
    <EOF> means end of string
*/
export declare enum TokenKind {
    ERROR = 0,
    ERROR_INCOMPLETE_KEY = 1,// "dupa<EOF>  (...)
    ERROR_INCOMPLETE_OBJECT = 2,// {3<EOF> (...)
    ERROR_INCOMPLETE_ARRAY = 3,// [5<EOF> (...)
    ERROR_INCOMPLETE_PRIMITIVE = 4,// #strin<EOF> (...)
    WHITESPACE = 5,
    OPERATOR_CHILD = 6,// > 
    OPERATOR_PARENT = 7,// <
    OPERATOR_SIBLING_NEXT = 8,// +
    OPERATOR_SIBLING_PREV = 9,// -
    OPERATOR_SIBLING_SUBSEQUENT = 10,// ++
    OPERATOR_SIBLING_PRECEDING = 11,// --
    OPERATOR_SIBLING_ANY = 12,// ~
    OPERATOR_OR = 13,// |
    OPERATOR_AND = 14,// &
    OPERATOR_NOT = 15,// !
    PARENTHESIS_LEFT = 16,// (
    PARENTHESIS_RIGHT = 17,// )
    MATCH_KEY = 18,// "dupa" (...)
    MATCH_KEY_NAKED = 19,// dupa   (...)
    MATCH_INDEX_ALL = 20,// 1234   (...)
    MATCH_INDEX_ARRAY = 21,// [1234] (...)
    MATCH_INDEX_OBJECT = 22,// {1234} (...)
    MATCH_WILDCARD_ALL = 23,// *
    MATCH_WILDCARD_ARRAY = 24,// [*]
    MATCH_WILDCARD_OBJECT = 25,// {*}
    PRIMITIVE_KIND_WILDCARD = 26,// #*
    PRIMITIVE_KIND_STRING = 27,// #string
    PRIMITIVE_KIND_NUMBER = 28,// #number
    PRIMITIVE_KIND_BOOLEAN = 29,// #boolean
    PRIMITIVE_NULL = 30,// #null
    PRIMITIVE_TRUE = 31,// #true
    PRIMITIVE_FALSE = 32,// #false
    PRIMITIVE_NUMBER = 33,// #124.2    (...)
    PRIMITIVE_STRING = 34
}
/**
    Bunch of helpers for easier work with the monstrous enum.
*/
export declare namespace enumUtils {
    function isError(t: TokenKind): boolean;
    function isErrorIncomplete(t: TokenKind): boolean;
    function isOperator(t: TokenKind): boolean;
    function isOperatorLogical(t: TokenKind): boolean;
    function isOperatorSibling(t: TokenKind): boolean;
    function isOperatorParentChild(t: TokenKind): boolean;
    function isMatch(t: TokenKind): boolean;
    function isPrimitive(t: TokenKind): boolean;
}
//# sourceMappingURL=lexer_enum.d.ts.map