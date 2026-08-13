import * as lexer from "./../lex/lexer_main.ts"

import {
	type ExpressionCombinator,
	type ConstraintTreeNodeKind,
	type ConstraintTreeNode,
} from "./parser_types.ts"

import {
	type ParseError
} from "./parser_errors.ts"


/**
	Structure representing a successful parse output

	Json match lang expression's syntax is inherently linear -
		each constraint block follows a combinator
		and each combinator follows a constraint block (or expression beggining)
	Thanks to that property, combinators and constaints 
	essentially come in pairs [combinator, constraint], ...

	hence: expression can be represented simply as two arrays:
		- combinators
		- contraints
	for any index i, (i < length):
		constraint[i] is constraint following the combinator at combinator[i]

*/
export type ExpressionParseTape = {
	combinators: Array<ExpressionCombinator>,
	constraints: Array<ConstraintTreeNode>,
}


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
): {parseTape: ExpressionParseTape, errors: Array<ParseError>} {

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
	
		const pairCombinator: ExpressionCombinator = pair[0];
		const pairConstraint: ConstraintTreeNode = pair[1];

		combinators.push(pairCombinator);
		constraints.push(pairConstraint);
		
		// tokens consumed equals to end of token range of last constraint
		tokensConsumed = pairConstraint.range[1];
	}

	
	// consumed entire token stream with no errors - success
	return {
		parseTape:{combinators, constraints},
		errors: [],
	};
}


function nextPair(
	filteredTokens: Readonly<Array<lexer.TokenKind>>,
	tokensConsumed: number,
): {pair: [ExpressionCombinator, ConstraintTreeNode], err: Array<ParseError>} {
	//@ts-expect-error
	return {}
}