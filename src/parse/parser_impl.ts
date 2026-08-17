import * as lexer from "./../lex/lexer_main.ts"

import {
	ExpressionCombinator,
	ConstraintTreeNodeKind,
	type ConstraintTreeNode,
	type ExpressionParseTape,
} from "./parser_types.ts"

import {
	type IncompleteParseError,
	ParseErrorKind,
} from "./parser_errors.ts"

import {parseConstraintsTopLevel} from "./parser_constraints.ts"


/**
	Generates expression parse tape from array of tokens
	without erros and with whitespaces filtered out.

	If syntax erorr was encountered during parsing, function returns 
	a partial result and returns errors via errors array alongside partial result.

	If tokens were parsed properly, errors will be an empty array
	and parseTape will contain a complete result.
*/
export function generateExpressionParseTape(
	filteredTokens: Readonly<Array<lexer.TokenKind>>
): {parseTape: ExpressionParseTape, errors: Array<IncompleteParseError>} {

	const combinators: Array<ExpressionCombinator> = [];
	const constraints: Array<ConstraintTreeNode> = [];
	
	let tokensConsumed = 0;
	const tokensTotal = filteredTokens.length;
	
	while (tokensConsumed < tokensTotal) {
		const {pair, err} = nextPair(filteredTokens, tokensConsumed);
		
		// if syntax error occured, early exit
		if (err.length){
			return {
				parseTape:{combinators, constraints},
				errors: err,
			};
		}
		// with no errors returned pair must not be undefined
		const pairCombinator: ExpressionCombinator = pair![0];
		const pairConstraint: ConstraintTreeNode = pair![1];

		combinators.push(pairCombinator);
		constraints.push(pairConstraint);
		
		// tokens consumed equals to end of token range of last constraint
		// pair cannot possibly parse into 0 tokens consumed.
		// this assertion prevents infinite loop in case of a fatal error.
		if (tokensConsumed == pairConstraint.range[1]){
			throw new Error("Catastrophic parser failure, infinite loop");
		}

		tokensConsumed = pairConstraint.range[1];
	}

	
	// consumed entire token stream with no errors - success
	return {
		parseTape:{combinators, constraints},
		errors: [],
	};
}


/**
	Runs parser forward to obtain next expression combinator and contraint 
	tree node pair. 

	If syntax error occured, returns undefined as pair value and 
	a non-empty IncompleteParseError array.

	If next pair parsed successfully, returns a valid pair value 
	and an empty IncompleteParseError array.
*/
function nextPair(
	filteredTokens: Readonly<Array<lexer.TokenKind>>,
	tokensConsumed: number,
): {
	pair: [ExpressionCombinator, ConstraintTreeNode] | undefined,
	err: Array<IncompleteParseError>
} {
	
	const combinatorResult = parseExpressionCombinator(filteredTokens, tokensConsumed);
	if (! combinatorResult.success){
		return {
			pair: undefined,
			err:[{ 
				targetKind: ParseErrorKind.WRONG_SYNTAX, 
				filteredTokenIndexes: [tokensConsumed],
			}],
		};
	}

	tokensConsumed += combinatorResult.consumed;

	const constraintResult = parseExpressionConstraint(filteredTokens, tokensConsumed);
	if (! constraintResult.success){
		return {
			pair: undefined,
			err:[{ 
				targetKind: ParseErrorKind.WRONG_SYNTAX, 
				filteredTokenIndexes: [tokensConsumed],
			}],
		};
	}
			
	return {
		pair: [combinatorResult.combinator,  constraintResult.constraint],
		err: [],
	};
}

/**
	Parses an expression combinator from tokens stream,
	starting at start index.
	
	Start must be lower than tokens.length (start < tokens.length)
	
	If parse succeded, returns: {ExpressionCombinator, consumedTokens, true}
	If parse failed, returns: {???, 0, false}
*/
function parseExpressionCombinator(
	tokens: Readonly<Array<lexer.TokenKind>>,
	start: number
): { combinator: ExpressionCombinator, consumed: number, success: boolean} {
	const nextToken = tokens[start];
	
	switch(nextToken){

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
	[lexer.TokenKind.OPERATOR_CHILD]:              ExpressionCombinator.CHILD,
	[lexer.TokenKind.OPERATOR_PARENT]:             ExpressionCombinator.PARENT,
	[lexer.TokenKind.OPERATOR_SIBLING_NEXT]:       ExpressionCombinator.SIBLING_NEXT,
	[lexer.TokenKind.OPERATOR_SIBLING_PREV]:       ExpressionCombinator.SIBLING_PREV,
	[lexer.TokenKind.OPERATOR_SIBLING_SUBSEQUENT]: ExpressionCombinator.SIBLING_SUBSEQUENT,
	[lexer.TokenKind.OPERATOR_SIBLING_PRECEDING]:  ExpressionCombinator.SIBLING_PRECEDING,
	[lexer.TokenKind.OPERATOR_SIBLING_ANY]:        ExpressionCombinator.SIBLING_ANY,
} as const;

function combinatorFromTable(nextToken: keyof typeof combinatorConversionTable): {
	combinator: ExpressionCombinator,
	consumed: number,
	success: boolean,
} {
	return {
		combinator: combinatorConversionTable[nextToken],
		consumed: 1,
		success: true,
	};
}

function combinatorImplicitDescendant(): {
	combinator: ExpressionCombinator,
	consumed: number,
	success: boolean,
} {
	return {
		combinator: ExpressionCombinator.DESCENDANT,
		consumed: 0,
		success: true,
	};
}

function combinatorMatchFail(): {
	combinator: ExpressionCombinator,
	consumed: number,
	success: boolean,
} {
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

	If parse succeded, returns: {ConstraintTreeNode, consumedTokens}
	If parse failed, returns: undefined

*/
function parseExpressionConstraint(
	tokens: Readonly<Array<lexer.TokenKind>>,
	start: number
): { constraint: ConstraintTreeNode, consumed: number, success: boolean} {

	// implicit wildcard if tape is out of tokens
	if (start == tokens.length){
		return implicitWildcardConstraintResult(start);
	}
	
	// implicit wildcard if next is a combinator operator
	switch(tokens[start]){
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
function implicitWildcardConstraintResult(currentIndex: number): 
	{constraint: ConstraintTreeNode, consumed: number, success: boolean} {

	const node: ConstraintTreeNode = {
		kind: ConstraintTreeNodeKind.ATOM,
		range: [currentIndex, currentIndex],
		children: [],
	}
	return {constraint: node, consumed: 0, success: true};
}