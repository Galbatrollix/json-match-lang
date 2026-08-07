export declare enum TokenKind {
    ERROR = 0,
    ERROR_INCOMPLETE_KEY = 1,
    ERROR_INCOMPLETE_PRIMITIVE = 2,
    WHITESPACE = 3,
    OPERATOR_CHILD = 4,// > 
    OPERATOR_PARENT = 5,// <
    OPERATOR_SIBLING_NEXT = 6,// +
    OPERATOR_SIBLING_PREV = 7,// -
    OPERATOR_SIBLING_SUBSEQUENT = 8,// ++
    OPERATOR_SIBLING_PRECEDING = 9,// --
    OPERATOR_SIBLING_ANY = 10,// ~
    OPERATOR_OR = 11,// |
    OPERATOR_AND = 12,// &
    OPERATOR_NOT = 13,// !
    PARENTHESIS_LEFT = 14,// (
    PARENTHESIS_RIGHT = 15,// )
    MATCH_KEY = 16,// "dupa" (...)
    MATCH_KEY_NAKED = 17,// dupa   (...)
    MATCH_INDEX_ALL = 18,// 1234   (...)
    MATCH_INDEX_ARRAY = 19,// [1234] (...)
    MATCH_INDEX_OBJECT = 20,// {1234} (...)
    MATCH_WILDCARD_ALL = 21,// *
    MATCH_WILDCARD_ARRAY = 22,// [*]
    MATCH_WILDCARD_OBJECT = 23,// {*}
    PRIMITIVE_KIND_WILDCARD = 24,// #*
    PRIMITIVE_KIND_STRING = 25,// #string
    PRIMITIVE_KIND_NUMBER = 26,// #number
    PRIMITIVE_KIND_BOOLEAN = 27,// #boolean
    PRIMITIVE_NULL = 28,// #null
    PRIMITIVE_TRUE = 29,// #true
    PRIMITIVE_FALSE = 30,// #false
    PRIMITIVE_NUMBER = 31,// #124.2    (...)
    PRIMITIVE_STRING = 32
}
export declare namespace enumUtils {
    function isOperator(t: TokenKind): boolean;
    function isOperatorLogical(t: TokenKind): boolean;
    function isOperatorSibling(t: TokenKind): boolean;
    function isOperatorParentChild(t: TokenKind): boolean;
    function isMatch(t: TokenKind): boolean;
    function isPrimitive(t: TokenKind): boolean;
}
//# sourceMappingURL=lexer_enum.d.ts.map