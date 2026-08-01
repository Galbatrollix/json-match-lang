export declare enum TokenKind {
    HEAD = 0,
    ERROR = 1,
    WHITESPACE = 2,
    OPERATOR_CHILD = 3,// > 
    OPERATOR_PARENT = 4,// <
    OPERATOR_SIBLING_NEXT = 5,// +
    OPERATOR_SIBLING_PREV = 6,// -
    OPERATOR_SIBLING_SUBSEQUENT = 7,// ++
    OPERATOR_SIBLING_PRECEDING = 8,// --
    OPERATOR_SIBLING_ANY = 9,// ~
    OPERATOR_OR = 10,// |
    OPERATOR_AND = 11,// &
    OPERATOR_NOT = 12,// !
    MATCH_KEY = 13,// "dupa" (...)
    MATCH_KEY_NAKED = 14,// dupa   (...)
    MATCH_INDEX_ALL = 15,// 1234   (...)
    MATCH_INDEX_ARRAY = 16,// [1234] (...)
    MATCH_INDEX_OBJECT = 17,// {1234} (...)
    MATCH_WILDCARD_ALL = 18,// *
    MATCH_WILDCARD_ARRAY = 19,// [*]
    MATCH_WILDCARD_OBJECT = 20,// {*}
    PRIMITIVE_KIND_WILDCARD = 21,// #*
    PRIMITIVE_KIND_STRING = 22,// #string
    PRIMITIVE_KIND_NUMBER = 23,// #number
    PRIMITIVE_KIND_BOOLEAN = 24,// #boolean
    PRIMITIVE_NULL = 25,// #null
    PRIMITIVE_TRUE = 26,// #true
    PRIMITIVE_FALSE = 27,// #false
    PRIMITIVE_NUMBER = 28,// #124.2    (...)
    PRIMITIVE_STRING = 29
}
export declare namespace TokenKind {
    function isOperator(t: TokenKind): boolean;
    function isOperatorLogical(t: TokenKind): boolean;
    function isOperatorSibling(t: TokenKind): boolean;
    function isOperatorParentChild(t: TokenKind): boolean;
    function isMatch(t: TokenKind): boolean;
    function isPrimitive(t: TokenKind): boolean;
}
//# sourceMappingURL=lexer_enum.d.ts.map