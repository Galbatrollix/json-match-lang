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
    ERROR_INCOMPLETE_VALUE = 4,// #strin<EOF> (...)
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
    KEY_QUOTED = 18,// "dupa" (...)
    KEY_NAKED = 19,// dupa   (...)
    INDEX_ALL = 20,// 1234   (...)
    INDEX_ARRAY = 21,// [1234] (...)
    INDEX_OBJECT = 22,// {1234} (...)
    WILDCARD_ALL = 23,// *
    WILDCARD_ARRAY = 24,// [*]
    WILDCARD_OBJECT = 25,// {*}
    VALUE_TYPE_WILDCARD = 26,// #*
    VALUE_TYPE_STRING = 27,// #string
    VALUE_TYPE_NUMBER = 28,// #number
    VALUE_TYPE_BOOLEAN = 29,// #boolean
    VALUE_TYPE_ARRAY = 30,// #[]
    VALUE_TYPE_OBJECT = 31,// #{}
    VALUE_EXACT_NULL = 32,// #null
    VALUE_EXACT_TRUE = 33,// #true
    VALUE_EXACT_FALSE = 34,// #false
    VALUE_EXACT_NUMBER = 35,// #124.2    (...)
    VALUE_EXACT_STRING = 36
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
    function isValue(t: TokenKind): boolean;
}
//# sourceMappingURL=lexer_enum.d.ts.map