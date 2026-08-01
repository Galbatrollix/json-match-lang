"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenKind = void 0;
/*
    All them types of tokens that lexing json path can possibly output.
    (...) means this is an example not the only possible value of the token
*/
var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["HEAD"] = 0] = "HEAD";
    TokenKind[TokenKind["ERROR"] = 1] = "ERROR";
    TokenKind[TokenKind["WHITESPACE"] = 2] = "WHITESPACE";
    TokenKind[TokenKind["OPERATOR_CHILD"] = 3] = "OPERATOR_CHILD";
    TokenKind[TokenKind["OPERATOR_PARENT"] = 4] = "OPERATOR_PARENT";
    TokenKind[TokenKind["OPERATOR_SIBLING_NEXT"] = 5] = "OPERATOR_SIBLING_NEXT";
    TokenKind[TokenKind["OPERATOR_SIBLING_PREV"] = 6] = "OPERATOR_SIBLING_PREV";
    TokenKind[TokenKind["OPERATOR_SIBLING_SUBSEQUENT"] = 7] = "OPERATOR_SIBLING_SUBSEQUENT";
    TokenKind[TokenKind["OPERATOR_SIBLING_PRECEDING"] = 8] = "OPERATOR_SIBLING_PRECEDING";
    TokenKind[TokenKind["OPERATOR_SIBLING_ANY"] = 9] = "OPERATOR_SIBLING_ANY";
    TokenKind[TokenKind["OPERATOR_OR"] = 10] = "OPERATOR_OR";
    TokenKind[TokenKind["OPERATOR_AND"] = 11] = "OPERATOR_AND";
    TokenKind[TokenKind["OPERATOR_NOT"] = 12] = "OPERATOR_NOT";
    // they match array indexes or object keys
    TokenKind[TokenKind["MATCH_KEY"] = 13] = "MATCH_KEY";
    TokenKind[TokenKind["MATCH_KEY_NAKED"] = 14] = "MATCH_KEY_NAKED";
    TokenKind[TokenKind["MATCH_INDEX_ALL"] = 15] = "MATCH_INDEX_ALL";
    TokenKind[TokenKind["MATCH_INDEX_ARRAY"] = 16] = "MATCH_INDEX_ARRAY";
    TokenKind[TokenKind["MATCH_INDEX_OBJECT"] = 17] = "MATCH_INDEX_OBJECT";
    TokenKind[TokenKind["MATCH_WILDCARD_ALL"] = 18] = "MATCH_WILDCARD_ALL";
    TokenKind[TokenKind["MATCH_WILDCARD_ARRAY"] = 19] = "MATCH_WILDCARD_ARRAY";
    TokenKind[TokenKind["MATCH_WILDCARD_OBJECT"] = 20] = "MATCH_WILDCARD_OBJECT";
    // they match type of primitives
    TokenKind[TokenKind["PRIMITIVE_KIND_WILDCARD"] = 21] = "PRIMITIVE_KIND_WILDCARD";
    TokenKind[TokenKind["PRIMITIVE_KIND_STRING"] = 22] = "PRIMITIVE_KIND_STRING";
    TokenKind[TokenKind["PRIMITIVE_KIND_NUMBER"] = 23] = "PRIMITIVE_KIND_NUMBER";
    TokenKind[TokenKind["PRIMITIVE_KIND_BOOLEAN"] = 24] = "PRIMITIVE_KIND_BOOLEAN";
    // they match exact values of primitives
    TokenKind[TokenKind["PRIMITIVE_NULL"] = 25] = "PRIMITIVE_NULL";
    TokenKind[TokenKind["PRIMITIVE_TRUE"] = 26] = "PRIMITIVE_TRUE";
    TokenKind[TokenKind["PRIMITIVE_FALSE"] = 27] = "PRIMITIVE_FALSE";
    TokenKind[TokenKind["PRIMITIVE_NUMBER"] = 28] = "PRIMITIVE_NUMBER";
    TokenKind[TokenKind["PRIMITIVE_STRING"] = 29] = "PRIMITIVE_STRING";
})(TokenKind || (exports.TokenKind = TokenKind = {}));
/*
    Bunch of helpers attached to the enum for easier work
    with the monstrous enum.
*/
(function (TokenKind) {
    function isOperator(t) {
        return (TokenKind.OPERATOR_CHILD <= t && t <= TokenKind.OPERATOR_NOT);
    }
    TokenKind.isOperator = isOperator;
    function isOperatorLogical(t) {
        return (TokenKind.OPERATOR_OR <= t && t <= TokenKind.OPERATOR_NOT);
    }
    TokenKind.isOperatorLogical = isOperatorLogical;
    function isOperatorSibling(t) {
        return (TokenKind.OPERATOR_SIBLING_NEXT <= t && t <= TokenKind.OPERATOR_SIBLING_ANY);
    }
    TokenKind.isOperatorSibling = isOperatorSibling;
    function isOperatorParentChild(t) {
        return (TokenKind.OPERATOR_CHILD <= t && t <= TokenKind.OPERATOR_PARENT);
    }
    TokenKind.isOperatorParentChild = isOperatorParentChild;
    function isMatch(t) {
        return (TokenKind.MATCH_KEY <= t && t <= TokenKind.MATCH_WILDCARD_OBJECT);
    }
    TokenKind.isMatch = isMatch;
    function isPrimitive(t) {
        return (TokenKind.PRIMITIVE_KIND_WILDCARD <= t && t <= TokenKind.PRIMITIVE_STRING);
    }
    TokenKind.isPrimitive = isPrimitive;
})(TokenKind || (exports.TokenKind = TokenKind = {}));
