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
    MATCH_KEY = 12,// "dupa" (...)
    MATCH_KEY_NAKED = 13,// dupa   (...)
    MATCH_INDEX_ALL = 14,// 1234   (...)
    MATCH_INDEX_ARRAY = 15,// [1234] (...)
    MATCH_INDEX_OBJECT = 16,// {1234} (...)
    MATCH_WILDCARD_ALL = 17,// *
    MATCH_WILDCARD_ARRAY = 18,// [*]
    MATCH_WILDCARD_OBJECT = 19,// {*}
    PRIMITIVE_KIND_WILDCARD = 20,// #*
    PRIMITIVE_KIND_STRING = 21,// #string
    PRIMITIVE_KIND_NUMBER = 22,// #number
    PRIMITIVE_KIND_BOOLEAN = 23,// #boolean
    PRIMITIVE_NULL = 24,// #null
    PRIMITIVE_TRUE = 25,// #true
    PRIMITIVE_FALSE = 26,// #false
    PRIMITIVE_NUMBER = 27,// #124.2    (...)
    PRIMITIVE_STRING = 28
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