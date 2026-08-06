export declare enum TokenKind {
    ERROR = 0,
    WHITESPACE = 1,
    OPERATOR_CHILD = 2,// > 
    OPERATOR_PARENT = 3,// <
    OPERATOR_SIBLING_NEXT = 4,// +
    OPERATOR_SIBLING_PREV = 5,// -
    OPERATOR_SIBLING_SUBSEQUENT = 6,// ++
    OPERATOR_SIBLING_PRECEDING = 7,// --
    OPERATOR_SIBLING_ANY = 8,// ~
    OPERATOR_OR = 9,// |
    OPERATOR_AND = 10,// &
    OPERATOR_NOT = 11,// !
    PARENTHESIS_LEFT = 12,// (
    PARENTHESIS_RIGHT = 13,// )
    MATCH_KEY = 14,// "dupa" (...)
    MATCH_KEY_NAKED = 15,// dupa   (...)
    MATCH_INDEX_ALL = 16,// 1234   (...)
    MATCH_INDEX_ARRAY = 17,// [1234] (...)
    MATCH_INDEX_OBJECT = 18,// {1234} (...)
    MATCH_WILDCARD_ALL = 19,// *
    MATCH_WILDCARD_ARRAY = 20,// [*]
    MATCH_WILDCARD_OBJECT = 21,// {*}
    PRIMITIVE_KIND_WILDCARD = 22,// #*
    PRIMITIVE_KIND_STRING = 23,// #string
    PRIMITIVE_KIND_NUMBER = 24,// #number
    PRIMITIVE_KIND_BOOLEAN = 25,// #boolean
    PRIMITIVE_NULL = 26,// #null
    PRIMITIVE_TRUE = 27,// #true
    PRIMITIVE_FALSE = 28,// #false
    PRIMITIVE_NUMBER = 29,// #124.2    (...)
    PRIMITIVE_STRING = 30
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