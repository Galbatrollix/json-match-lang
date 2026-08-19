import * as lexer from "./../lex/lexer_a_index.js";
import { ExpressionCombinator, ConstraintTreeNodeKind, } from "./parser_types.js";
import { ParseErrorKind, } from "./parser_errors.js";
import { parseConstraintsTopLevel } from "./parser_constraints.js";
/**
    Generates expression parse tape from array of tokens
    without erros and with whitespaces filtered out.

    If syntax erorr was encountered during parsing, function returns
    a partial result and returns errors via errors array alongside partial result.

    If tokens were parsed properly, errors will be an empty array
    and parseTape will contain a complete result.
*/
export function generateRawExpressionParseTape(filteredTokens) {
    const combinators = [];
    const constraints = [];
    let tokensConsumed = 0;
    const tokensTotal = filteredTokens.length;
    while (tokensConsumed < tokensTotal) {
        const { pair, consumed, err } = nextPair(filteredTokens, tokensConsumed);
        // if parsing error occured, early exit
        if (err.length) {
            return {
                parseTape: { combinators, constraints },
                errors: err,
            };
        }
        // with no errors returned pair must not be undefined
        const pairCombinator = pair[0];
        const pairConstraint = pair[1];
        combinators.push(pairCombinator);
        constraints.push(pairConstraint);
        // pair cannot possibly parse into 0 tokens consumed.
        // this assertion prevents infinite loop in case of a fatal error.
        if (consumed == 0) {
            throw new Error("Catastrophic parser failure, infinite loop");
        }
        tokensConsumed += consumed;
    }
    // consumed entire token stream with no errors - success
    return {
        parseTape: { combinators, constraints },
        errors: [],
    };
}
/**
    Runs parser forward to obtain next expression combinator and contraint
    tree node pair.
    // 	TODO BETTER DOCSTRING
*/
function nextPair(filteredTokens, start) {
    const combinatorResult = parseExpressionCombinator(filteredTokens, start);
    // constraint start is moved by 1 if combinator parse failed.
    // This is in order to run constraint parse anyway and gather intel
    // for error info on what could have caused a problem.
    const constraintStart = combinatorResult.success
        ? start + combinatorResult.consumed
        : start + 1;
    // parsing constraint is enclosed in a trycatch, for the stack overflow is a possibility
    try {
        var constraintResult = parseExpressionConstraint(filteredTokens, constraintStart);
    }
    catch (e) {
        return nextPairErrorResult(stackOverflowError(constraintStart));
    }
    // both parsed properly, just return valid values
    if (combinatorResult.success && constraintResult.success) {
        return {
            pair: [combinatorResult.combinator, constraintResult.constraint],
            consumed: constraintStart - start + constraintResult.consumed,
            err: [],
        };
    }
    // at least one did not parse properly, returning a syntax error
    //todo fiddle with returned index value to maybe compensate for combinator consumed
    return nextPairErrorResult(syntaxError(constraintStart + constraintResult.consumed - 1));
}
/**
    Constructs a full error-result for nextPair function
    from just an IncompleteParseError instance.
*/
function nextPairErrorResult(err) {
    return {
        pair: undefined,
        consumed: 0,
        err: [err],
    };
}
/**
    Constructs a new IncompleteParseError of target kind stack overflow
    with provided tokenIndex in filteredTokenIndexes collection.
*/
function stackOverflowError(tokenIndex) {
    return {
        targetKind: ParseErrorKind.STACK_OVERFLOW,
        filteredTokenIndexes: [tokenIndex],
    };
}
/**
    Constructs a new IncompleteParseError of target kind wrong syntax
    with provided tokenIndex in filteredTokenIndexes collection.
*/
function syntaxError(tokenIndex) {
    return {
        targetKind: ParseErrorKind.WRONG_SYNTAX,
        filteredTokenIndexes: [tokenIndex],
    };
}
/**
    Parses an expression combinator from tokens stream,
    starting at start index.
    
    Start must be lower than tokens.length (start < tokens.length)
    
    If parse succeded, returns: {ExpressionCombinator, consumedTokens, true}
    If parse failed, returns: {???, 0, false}
*/
function parseExpressionCombinator(tokens, start) {
    const nextToken = tokens[start];
    switch (nextToken) {
        // something went horribly wrong if this case is hit.
        case lexer.TokenKind.ERROR_INCOMPLETE_KEY:
        case lexer.TokenKind.ERROR_INCOMPLETE_OBJECT:
        case lexer.TokenKind.ERROR_INCOMPLETE_ARRAY:
        case lexer.TokenKind.ERROR_INCOMPLETE_VALUE:
        case lexer.TokenKind.ERROR:
        case lexer.TokenKind.WHITESPACE:
            throw new Error("Fatal parser error, whitespace or error tokens"
                + " did not filter properly");
        // logical operators and right parenthesis mean syntax error occured
        case lexer.TokenKind.OPERATOR_OR:
        case lexer.TokenKind.OPERATOR_AND:
        case lexer.TokenKind.PARENTHESIS_RIGHT:
            return combinatorMatchFail();
        // precise operator detected, use conversion table
        case lexer.TokenKind.OPERATOR_CHILD:
        case lexer.TokenKind.OPERATOR_PARENT:
        case lexer.TokenKind.OPERATOR_SIBLING_NEXT:
        case lexer.TokenKind.OPERATOR_SIBLING_PREV:
        case lexer.TokenKind.OPERATOR_SIBLING_SUBSEQUENT:
        case lexer.TokenKind.OPERATOR_SIBLING_PRECEDING:
        case lexer.TokenKind.OPERATOR_SIBLING_ANY:
            return combinatorFromTable(nextToken);
        // if precise operator not detected but next token suggests beggining 
        // of constraint block, it signals the implicit descendant operator.
        default:
            return combinatorImplicitDescendant();
    }
}
/**
    A table-like object that provides mapping
    between tokens and their respective expression combinators.
*/
const combinatorConversionTable = {
    [lexer.TokenKind.OPERATOR_CHILD]: ExpressionCombinator.CHILD,
    [lexer.TokenKind.OPERATOR_PARENT]: ExpressionCombinator.PARENT,
    [lexer.TokenKind.OPERATOR_SIBLING_NEXT]: ExpressionCombinator.SIBLING_NEXT,
    [lexer.TokenKind.OPERATOR_SIBLING_PREV]: ExpressionCombinator.SIBLING_PREV,
    [lexer.TokenKind.OPERATOR_SIBLING_SUBSEQUENT]: ExpressionCombinator.SIBLING_SUBSEQUENT,
    [lexer.TokenKind.OPERATOR_SIBLING_PRECEDING]: ExpressionCombinator.SIBLING_PRECEDING,
    [lexer.TokenKind.OPERATOR_SIBLING_ANY]: ExpressionCombinator.SIBLING_ANY,
};
function combinatorFromTable(nextToken) {
    return {
        combinator: combinatorConversionTable[nextToken],
        consumed: 1,
        success: true,
    };
}
function combinatorImplicitDescendant() {
    return {
        combinator: ExpressionCombinator.DESCENDANT,
        consumed: 0,
        success: true,
    };
}
function combinatorMatchFail() {
    return {
        // using descendant as a default garbage value
        combinator: ExpressionCombinator.DESCENDANT,
        consumed: 0,
        success: false,
    };
}
/**
    Parses a constraint block in the json match lang expression.
    Handles simple cases such as end of token array or
    combinator operator being a next token.
    
    Otherwise, delegates heavy work to specialized
    constraint block parser.

    If next token is a combinator operator or there is no tokens left
    , then resulting constraint node is implicitly a wildcard constraint
    and consumes 0 tokens.

    If parse succeded, returns: {RawConstraintTreeNode, consumedTokens}
    If parse failed, returns: undefined

*/
function parseExpressionConstraint(tokens, start) {
    // implicit wildcard if tape is out of tokens
    if (start == tokens.length) {
        return implicitWildcardConstraintResult(start);
    }
    // implicit wildcard if next is a combinator operator
    switch (tokens[start]) {
        default:
            break;
        case lexer.TokenKind.OPERATOR_CHILD:
        case lexer.TokenKind.OPERATOR_PARENT:
        case lexer.TokenKind.OPERATOR_SIBLING_NEXT:
        case lexer.TokenKind.OPERATOR_SIBLING_PREV:
        case lexer.TokenKind.OPERATOR_SIBLING_SUBSEQUENT:
        case lexer.TokenKind.OPERATOR_SIBLING_PRECEDING:
        case lexer.TokenKind.OPERATOR_SIBLING_ANY:
            return implicitWildcardConstraintResult(start);
    }
    // otherwise perform serious constraint block parse.
    return parseConstraintsTopLevel(tokens, start);
}
/**
    A helper that assembles a return value for parseExpressionConstraint function
    which corresponding to implicit wildcard case.
*/
function implicitWildcardConstraintResult(currentIndex) {
    const node = {
        kind: ConstraintTreeNodeKind.IMPLICIT,
        range: [currentIndex, currentIndex],
        children: [],
    };
    return { constraint: node, consumed: 0, success: true };
}
