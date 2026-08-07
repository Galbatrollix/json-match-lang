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
    TokenKind[TokenKind["ERROR_INCOMPLETE_KEY"] = 1] = "ERROR_INCOMPLETE_KEY";
    //ERROR_INCOMPLETE_OBJECT
    //ERROR_INCOMPLETE_ARRAY
    TokenKind[TokenKind["ERROR_INCOMPLETE_PRIMITIVE"] = 2] = "ERROR_INCOMPLETE_PRIMITIVE";
    TokenKind[TokenKind["WHITESPACE"] = 3] = "WHITESPACE";
    TokenKind[TokenKind["OPERATOR_CHILD"] = 4] = "OPERATOR_CHILD";
    TokenKind[TokenKind["OPERATOR_PARENT"] = 5] = "OPERATOR_PARENT";
    TokenKind[TokenKind["OPERATOR_SIBLING_NEXT"] = 6] = "OPERATOR_SIBLING_NEXT";
    TokenKind[TokenKind["OPERATOR_SIBLING_PREV"] = 7] = "OPERATOR_SIBLING_PREV";
    TokenKind[TokenKind["OPERATOR_SIBLING_SUBSEQUENT"] = 8] = "OPERATOR_SIBLING_SUBSEQUENT";
    TokenKind[TokenKind["OPERATOR_SIBLING_PRECEDING"] = 9] = "OPERATOR_SIBLING_PRECEDING";
    TokenKind[TokenKind["OPERATOR_SIBLING_ANY"] = 10] = "OPERATOR_SIBLING_ANY";
    TokenKind[TokenKind["OPERATOR_OR"] = 11] = "OPERATOR_OR";
    TokenKind[TokenKind["OPERATOR_AND"] = 12] = "OPERATOR_AND";
    TokenKind[TokenKind["OPERATOR_NOT"] = 13] = "OPERATOR_NOT";
    TokenKind[TokenKind["PARENTHESIS_LEFT"] = 14] = "PARENTHESIS_LEFT";
    TokenKind[TokenKind["PARENTHESIS_RIGHT"] = 15] = "PARENTHESIS_RIGHT";
    // they match array indexes or object keys
    TokenKind[TokenKind["MATCH_KEY"] = 16] = "MATCH_KEY";
    TokenKind[TokenKind["MATCH_KEY_NAKED"] = 17] = "MATCH_KEY_NAKED";
    TokenKind[TokenKind["MATCH_INDEX_ALL"] = 18] = "MATCH_INDEX_ALL";
    TokenKind[TokenKind["MATCH_INDEX_ARRAY"] = 19] = "MATCH_INDEX_ARRAY";
    TokenKind[TokenKind["MATCH_INDEX_OBJECT"] = 20] = "MATCH_INDEX_OBJECT";
    TokenKind[TokenKind["MATCH_WILDCARD_ALL"] = 21] = "MATCH_WILDCARD_ALL";
    TokenKind[TokenKind["MATCH_WILDCARD_ARRAY"] = 22] = "MATCH_WILDCARD_ARRAY";
    TokenKind[TokenKind["MATCH_WILDCARD_OBJECT"] = 23] = "MATCH_WILDCARD_OBJECT";
    // they match type of primitives
    TokenKind[TokenKind["PRIMITIVE_KIND_WILDCARD"] = 24] = "PRIMITIVE_KIND_WILDCARD";
    TokenKind[TokenKind["PRIMITIVE_KIND_STRING"] = 25] = "PRIMITIVE_KIND_STRING";
    TokenKind[TokenKind["PRIMITIVE_KIND_NUMBER"] = 26] = "PRIMITIVE_KIND_NUMBER";
    TokenKind[TokenKind["PRIMITIVE_KIND_BOOLEAN"] = 27] = "PRIMITIVE_KIND_BOOLEAN";
    // they match exact values of primitives
    TokenKind[TokenKind["PRIMITIVE_NULL"] = 28] = "PRIMITIVE_NULL";
    TokenKind[TokenKind["PRIMITIVE_TRUE"] = 29] = "PRIMITIVE_TRUE";
    TokenKind[TokenKind["PRIMITIVE_FALSE"] = 30] = "PRIMITIVE_FALSE";
    TokenKind[TokenKind["PRIMITIVE_NUMBER"] = 31] = "PRIMITIVE_NUMBER";
    TokenKind[TokenKind["PRIMITIVE_STRING"] = 32] = "PRIMITIVE_STRING";
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
