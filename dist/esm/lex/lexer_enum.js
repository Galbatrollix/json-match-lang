/**
    All them types of tokens that lexing json path can possibly output.
    (...) means this is an example not the only possible value of the token
    <EOF> means end of string
*/
export var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["ERROR"] = 0] = "ERROR";
    TokenKind[TokenKind["ERROR_INCOMPLETE_KEY"] = 1] = "ERROR_INCOMPLETE_KEY";
    TokenKind[TokenKind["ERROR_INCOMPLETE_OBJECT"] = 2] = "ERROR_INCOMPLETE_OBJECT";
    TokenKind[TokenKind["ERROR_INCOMPLETE_ARRAY"] = 3] = "ERROR_INCOMPLETE_ARRAY";
    TokenKind[TokenKind["ERROR_INCOMPLETE_PRIMITIVE"] = 4] = "ERROR_INCOMPLETE_PRIMITIVE";
    TokenKind[TokenKind["WHITESPACE"] = 5] = "WHITESPACE";
    TokenKind[TokenKind["OPERATOR_CHILD"] = 6] = "OPERATOR_CHILD";
    TokenKind[TokenKind["OPERATOR_PARENT"] = 7] = "OPERATOR_PARENT";
    TokenKind[TokenKind["OPERATOR_SIBLING_NEXT"] = 8] = "OPERATOR_SIBLING_NEXT";
    TokenKind[TokenKind["OPERATOR_SIBLING_PREV"] = 9] = "OPERATOR_SIBLING_PREV";
    TokenKind[TokenKind["OPERATOR_SIBLING_SUBSEQUENT"] = 10] = "OPERATOR_SIBLING_SUBSEQUENT";
    TokenKind[TokenKind["OPERATOR_SIBLING_PRECEDING"] = 11] = "OPERATOR_SIBLING_PRECEDING";
    TokenKind[TokenKind["OPERATOR_SIBLING_ANY"] = 12] = "OPERATOR_SIBLING_ANY";
    TokenKind[TokenKind["OPERATOR_OR"] = 13] = "OPERATOR_OR";
    TokenKind[TokenKind["OPERATOR_AND"] = 14] = "OPERATOR_AND";
    TokenKind[TokenKind["OPERATOR_NOT"] = 15] = "OPERATOR_NOT";
    TokenKind[TokenKind["PARENTHESIS_LEFT"] = 16] = "PARENTHESIS_LEFT";
    TokenKind[TokenKind["PARENTHESIS_RIGHT"] = 17] = "PARENTHESIS_RIGHT";
    // they match array indexes or object keys
    TokenKind[TokenKind["MATCH_KEY"] = 18] = "MATCH_KEY";
    TokenKind[TokenKind["MATCH_KEY_NAKED"] = 19] = "MATCH_KEY_NAKED";
    TokenKind[TokenKind["MATCH_INDEX_ALL"] = 20] = "MATCH_INDEX_ALL";
    TokenKind[TokenKind["MATCH_INDEX_ARRAY"] = 21] = "MATCH_INDEX_ARRAY";
    TokenKind[TokenKind["MATCH_INDEX_OBJECT"] = 22] = "MATCH_INDEX_OBJECT";
    TokenKind[TokenKind["MATCH_WILDCARD_ALL"] = 23] = "MATCH_WILDCARD_ALL";
    TokenKind[TokenKind["MATCH_WILDCARD_ARRAY"] = 24] = "MATCH_WILDCARD_ARRAY";
    TokenKind[TokenKind["MATCH_WILDCARD_OBJECT"] = 25] = "MATCH_WILDCARD_OBJECT";
    // they match type of primitives
    TokenKind[TokenKind["PRIMITIVE_KIND_WILDCARD"] = 26] = "PRIMITIVE_KIND_WILDCARD";
    TokenKind[TokenKind["PRIMITIVE_KIND_STRING"] = 27] = "PRIMITIVE_KIND_STRING";
    TokenKind[TokenKind["PRIMITIVE_KIND_NUMBER"] = 28] = "PRIMITIVE_KIND_NUMBER";
    TokenKind[TokenKind["PRIMITIVE_KIND_BOOLEAN"] = 29] = "PRIMITIVE_KIND_BOOLEAN";
    // they match exact values of primitives
    TokenKind[TokenKind["PRIMITIVE_NULL"] = 30] = "PRIMITIVE_NULL";
    TokenKind[TokenKind["PRIMITIVE_TRUE"] = 31] = "PRIMITIVE_TRUE";
    TokenKind[TokenKind["PRIMITIVE_FALSE"] = 32] = "PRIMITIVE_FALSE";
    TokenKind[TokenKind["PRIMITIVE_NUMBER"] = 33] = "PRIMITIVE_NUMBER";
    TokenKind[TokenKind["PRIMITIVE_STRING"] = 34] = "PRIMITIVE_STRING";
})(TokenKind || (TokenKind = {}));
/**
    Bunch of helpers for easier work with the monstrous enum.
*/
export var enumUtils;
(function (enumUtils) {
    function isError(t) {
        return (TokenKind.ERROR <= t && t <= TokenKind.ERROR_INCOMPLETE_PRIMITIVE);
    }
    enumUtils.isError = isError;
    function isErrorIncomplete(t) {
        return (TokenKind.ERROR_INCOMPLETE_KEY <= t && t <= TokenKind.ERROR_INCOMPLETE_PRIMITIVE);
    }
    enumUtils.isErrorIncomplete = isErrorIncomplete;
    function isOperator(t) {
        return (TokenKind.OPERATOR_CHILD <= t && t <= TokenKind.OPERATOR_NOT);
    }
    enumUtils.isOperator = isOperator;
    function isOperatorLogical(t) {
        return (TokenKind.OPERATOR_OR <= t && t <= TokenKind.OPERATOR_NOT);
    }
    enumUtils.isOperatorLogical = isOperatorLogical;
    function isOperatorSibling(t) {
        return (TokenKind.OPERATOR_SIBLING_NEXT <= t && t <= TokenKind.OPERATOR_SIBLING_ANY);
    }
    enumUtils.isOperatorSibling = isOperatorSibling;
    function isOperatorParentChild(t) {
        return (TokenKind.OPERATOR_CHILD <= t && t <= TokenKind.OPERATOR_PARENT);
    }
    enumUtils.isOperatorParentChild = isOperatorParentChild;
    function isMatch(t) {
        return (TokenKind.MATCH_KEY <= t && t <= TokenKind.MATCH_WILDCARD_OBJECT);
    }
    enumUtils.isMatch = isMatch;
    function isPrimitive(t) {
        return (TokenKind.PRIMITIVE_KIND_WILDCARD <= t && t <= TokenKind.PRIMITIVE_STRING);
    }
    enumUtils.isPrimitive = isPrimitive;
})(enumUtils || (enumUtils = {}));
