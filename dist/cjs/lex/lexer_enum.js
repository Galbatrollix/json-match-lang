"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enumUtils = exports.TokenKind = void 0;
/*
    All them types of tokens that lexing json path can possibly output.
    (...) means this is an example not the only possible value of the token
*/
var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["ERROR"] = 0] = "ERROR";
    TokenKind[TokenKind["WHITESPACE"] = 1] = "WHITESPACE";
    TokenKind[TokenKind["OPERATOR_CHILD"] = 2] = "OPERATOR_CHILD";
    TokenKind[TokenKind["OPERATOR_PARENT"] = 3] = "OPERATOR_PARENT";
    TokenKind[TokenKind["OPERATOR_SIBLING_NEXT"] = 4] = "OPERATOR_SIBLING_NEXT";
    TokenKind[TokenKind["OPERATOR_SIBLING_PREV"] = 5] = "OPERATOR_SIBLING_PREV";
    TokenKind[TokenKind["OPERATOR_SIBLING_SUBSEQUENT"] = 6] = "OPERATOR_SIBLING_SUBSEQUENT";
    TokenKind[TokenKind["OPERATOR_SIBLING_PRECEDING"] = 7] = "OPERATOR_SIBLING_PRECEDING";
    TokenKind[TokenKind["OPERATOR_SIBLING_ANY"] = 8] = "OPERATOR_SIBLING_ANY";
    TokenKind[TokenKind["OPERATOR_OR"] = 9] = "OPERATOR_OR";
    TokenKind[TokenKind["OPERATOR_AND"] = 10] = "OPERATOR_AND";
    TokenKind[TokenKind["OPERATOR_NOT"] = 11] = "OPERATOR_NOT";
    TokenKind[TokenKind["PARENTHESIS_LEFT"] = 12] = "PARENTHESIS_LEFT";
    TokenKind[TokenKind["PARENTHESIS_RIGHT"] = 13] = "PARENTHESIS_RIGHT";
    // they match array indexes or object keys
    TokenKind[TokenKind["MATCH_KEY"] = 14] = "MATCH_KEY";
    TokenKind[TokenKind["MATCH_KEY_NAKED"] = 15] = "MATCH_KEY_NAKED";
    TokenKind[TokenKind["MATCH_INDEX_ALL"] = 16] = "MATCH_INDEX_ALL";
    TokenKind[TokenKind["MATCH_INDEX_ARRAY"] = 17] = "MATCH_INDEX_ARRAY";
    TokenKind[TokenKind["MATCH_INDEX_OBJECT"] = 18] = "MATCH_INDEX_OBJECT";
    TokenKind[TokenKind["MATCH_WILDCARD_ALL"] = 19] = "MATCH_WILDCARD_ALL";
    TokenKind[TokenKind["MATCH_WILDCARD_ARRAY"] = 20] = "MATCH_WILDCARD_ARRAY";
    TokenKind[TokenKind["MATCH_WILDCARD_OBJECT"] = 21] = "MATCH_WILDCARD_OBJECT";
    // they match type of primitives
    TokenKind[TokenKind["PRIMITIVE_KIND_WILDCARD"] = 22] = "PRIMITIVE_KIND_WILDCARD";
    TokenKind[TokenKind["PRIMITIVE_KIND_STRING"] = 23] = "PRIMITIVE_KIND_STRING";
    TokenKind[TokenKind["PRIMITIVE_KIND_NUMBER"] = 24] = "PRIMITIVE_KIND_NUMBER";
    TokenKind[TokenKind["PRIMITIVE_KIND_BOOLEAN"] = 25] = "PRIMITIVE_KIND_BOOLEAN";
    // they match exact values of primitives
    TokenKind[TokenKind["PRIMITIVE_NULL"] = 26] = "PRIMITIVE_NULL";
    TokenKind[TokenKind["PRIMITIVE_TRUE"] = 27] = "PRIMITIVE_TRUE";
    TokenKind[TokenKind["PRIMITIVE_FALSE"] = 28] = "PRIMITIVE_FALSE";
    TokenKind[TokenKind["PRIMITIVE_NUMBER"] = 29] = "PRIMITIVE_NUMBER";
    TokenKind[TokenKind["PRIMITIVE_STRING"] = 30] = "PRIMITIVE_STRING";
})(TokenKind || (exports.TokenKind = TokenKind = {}));
/*
    Bunch of helpers attached to the enum for easier work
    with the monstrous enum.
*/
var enumUtils;
(function (enumUtils) {
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
})(enumUtils || (exports.enumUtils = enumUtils = {}));
