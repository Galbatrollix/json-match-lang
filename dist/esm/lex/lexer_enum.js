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
    TokenKind[TokenKind["ERROR_INCOMPLETE_VALUE"] = 4] = "ERROR_INCOMPLETE_VALUE";
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
    TokenKind[TokenKind["KEY_QUOTED"] = 18] = "KEY_QUOTED";
    TokenKind[TokenKind["KEY_NAKED"] = 19] = "KEY_NAKED";
    TokenKind[TokenKind["INDEX_ALL"] = 20] = "INDEX_ALL";
    TokenKind[TokenKind["INDEX_ARRAY"] = 21] = "INDEX_ARRAY";
    TokenKind[TokenKind["INDEX_OBJECT"] = 22] = "INDEX_OBJECT";
    TokenKind[TokenKind["WILDCARD_ALL"] = 23] = "WILDCARD_ALL";
    TokenKind[TokenKind["WILDCARD_ARRAY"] = 24] = "WILDCARD_ARRAY";
    TokenKind[TokenKind["WILDCARD_OBJECT"] = 25] = "WILDCARD_OBJECT";
    // they match type of primitives
    TokenKind[TokenKind["VALUE_TYPE_WILDCARD"] = 26] = "VALUE_TYPE_WILDCARD";
    TokenKind[TokenKind["VALUE_TYPE_STRING"] = 27] = "VALUE_TYPE_STRING";
    TokenKind[TokenKind["VALUE_TYPE_NUMBER"] = 28] = "VALUE_TYPE_NUMBER";
    TokenKind[TokenKind["VALUE_TYPE_BOOLEAN"] = 29] = "VALUE_TYPE_BOOLEAN";
    TokenKind[TokenKind["VALUE_TYPE_ARRAY"] = 30] = "VALUE_TYPE_ARRAY";
    TokenKind[TokenKind["VALUE_TYPE_OBJECT"] = 31] = "VALUE_TYPE_OBJECT";
    // they match exact values of primitives
    TokenKind[TokenKind["VALUE_EXACT_NULL"] = 32] = "VALUE_EXACT_NULL";
    TokenKind[TokenKind["VALUE_EXACT_TRUE"] = 33] = "VALUE_EXACT_TRUE";
    TokenKind[TokenKind["VALUE_EXACT_FALSE"] = 34] = "VALUE_EXACT_FALSE";
    TokenKind[TokenKind["VALUE_EXACT_NUMBER"] = 35] = "VALUE_EXACT_NUMBER";
    TokenKind[TokenKind["VALUE_EXACT_STRING"] = 36] = "VALUE_EXACT_STRING";
})(TokenKind || (TokenKind = {}));
/**
    Bunch of helpers for easier work with the monstrous enum.
*/
export var TokenKindUtils;
(function (TokenKindUtils) {
    function isError(t) {
        return (TokenKind.ERROR <= t && t <= TokenKind.ERROR_INCOMPLETE_VALUE);
    }
    TokenKindUtils.isError = isError;
    function isErrorIncomplete(t) {
        return (TokenKind.ERROR_INCOMPLETE_KEY <= t && t <= TokenKind.ERROR_INCOMPLETE_VALUE);
    }
    TokenKindUtils.isErrorIncomplete = isErrorIncomplete;
    function isOperator(t) {
        return (TokenKind.OPERATOR_CHILD <= t && t <= TokenKind.OPERATOR_NOT);
    }
    TokenKindUtils.isOperator = isOperator;
    function isOperatorLogical(t) {
        return (TokenKind.OPERATOR_OR <= t && t <= TokenKind.OPERATOR_NOT);
    }
    TokenKindUtils.isOperatorLogical = isOperatorLogical;
    function isOperatorSibling(t) {
        return (TokenKind.OPERATOR_SIBLING_NEXT <= t && t <= TokenKind.OPERATOR_SIBLING_ANY);
    }
    TokenKindUtils.isOperatorSibling = isOperatorSibling;
    function isOperatorParentChild(t) {
        return (TokenKind.OPERATOR_CHILD <= t && t <= TokenKind.OPERATOR_PARENT);
    }
    TokenKindUtils.isOperatorParentChild = isOperatorParentChild;
    function isConstraint(t) {
        return (TokenKind.KEY_QUOTED <= t && t <= TokenKind.VALUE_EXACT_STRING);
    }
    TokenKindUtils.isConstraint = isConstraint;
    function isValueConstraint(t) {
        return (TokenKind.VALUE_TYPE_WILDCARD <= t && t <= TokenKind.VALUE_EXACT_STRING);
    }
    TokenKindUtils.isValueConstraint = isValueConstraint;
})(TokenKindUtils || (TokenKindUtils = {}));
