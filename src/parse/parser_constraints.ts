import {
	ConstraintTreeNodeKind,
	type ConstraintTreeNode,
} from "./parser_types.ts"

import * as lexer from "./../lex/lexer_main.ts"


/**
	This file contains recursive descent parser for a
	constraint block in json match lang expression.

	EBNF-like informal description of syntax encoded in the recursive descent:	

	or block =             and block , {OPERATOR_OR, and block}
	and block =            term , {OPERATOR_AND, term}
	term =                 negation | parenthesised block | atom
	negation =             OPERATOR_NOT, (parenthesised block | atom)
	parenthesized block =  PARENTHESIS_LEFT, or block ,PARENTHESIS_RIGHT
	atom =                 KEY_NAKED | KEY_QUOTED| (... and other single-token constraints)


*/

/**
	Definition that parse functions should obey, 
	function tries to parse its respective syntax starting at start and 
	executing no futher than tokens.length.

	Any tree node the function may generate should be APPENDED to the
	supplied outputTree array. Function shall not append anything if it 
	fails to parse (returns false as second parameter)
	Not all functions have to append to output tree.

	On success function should return:
		[tokensConsumed, true]
	On failure function should return:
		[tokensConsumedUntilFail, false]
	
*/
type ParseFunction = (
	tokens: Readonly<Array<lexer.TokenKind>>,
 	start: number,
	outputTree: Array<ConstraintTreeNode>,
) => [consumed: number, matched: boolean];


/**
	Top level function that will be called by the main 
	parser once a constraint block must be handled.
	
	If parse succeded, returns: {ConstraintTreeNode, consumedTokens}
	If parse failed, returns: undefined
	
*/
export function parseConstraintsTopLevel(
	tokens: Readonly<Array<lexer.TokenKind>>,
	start: number,
): { constraint: ConstraintTreeNode, consumed: number} | undefined {
	const dummyTreeNode: Array<ConstraintTreeNode> = []

	//const [consumed, success] = parseOrBlock(tokens, start, dummyTreeNode);
	const [consumed, success] = parseTerm(tokens, start, dummyTreeNode);
	if (success){
		return {
			constraint: dummyTreeNode[0],
			consumed: consumed,
		}
	}else{
		return undefined;
	}
}

/**
	Parses a single token atom constraint
*/
function parseAtom(
	tokens: Readonly<Array<lexer.TokenKind>>,
 	start: number,
	outputTree: Array<ConstraintTreeNode>,
): [number, boolean] {
	if (start == tokens.length){
		return [0, false];
	}
	
	const tokenOk: boolean = lexer.TokenKindUtils.isConstraint(tokens[start]);
	if (! tokenOk){
		return [0, false];
	}
	
	// success, emitting AST node
	const newNode: ConstraintTreeNode = {
		kind: ConstraintTreeNodeKind.ATOM,
		range: [start, start + 1],
		children: [],
	}
	outputTree.push(newNode);
	
	return [1, true];
}



function parseAndBlock(
	tokens: Readonly<Array<lexer.TokenKind>>,
 	start: number,
	outputTree: Array<ConstraintTreeNode>,
): [number, boolean] {
	return [0, false];
}

function parseOrBlock(
	tokens: Readonly<Array<lexer.TokenKind>>,
 	start: number,
	outputTree: Array<ConstraintTreeNode>,
): [number, boolean] {
	return [0, false];
}



function parseParenthesizedBlock(
	tokens: Readonly<Array<lexer.TokenKind>>,
 	start: number,
	outputTree: Array<ConstraintTreeNode>,
): [number, boolean] {
	return [0, false];
}

const parseTerm: ParseFunction = combinatorOr(
	[parseNegation, parseAtom, parseParenthesizedBlock]
);

const parseParenthesizedBlockOrAtom: ParseFunction = combinatorOr(
	[parseAtom, parseParenthesizedBlock]
);

function parseNegation(
	tokens: Readonly<Array<lexer.TokenKind>>,
 	start: number,
	outputTree: Array<ConstraintTreeNode>,
): [number, boolean] {
	if (start == tokens.length){
		return [0, false];
	}

	const notTokenPresent: boolean = tokens[start] == lexer.TokenKind.OPERATOR_NOT;
	if (! notTokenPresent){
		return [0, false];
	}
	
	const childTree: Array<ConstraintTreeNode> = []
	
	const [consumed, matched] = parseParenthesizedBlockOrAtom(
		tokens,
		start + 1,
		childTree,
	);
	
	if (! matched){
		return [consumed + 1, false];
	}

	// inner function matched, construct output
	const newNode: ConstraintTreeNode = {
		kind: ConstraintTreeNodeKind.NOT,
		range: [start, start + consumed + 1],
		children: childTree,
	}
	outputTree.push(newNode);
	
	
	return [consumed + 1, true];
}


/*
	Parser combinator that tranforms an array of parse functions into a single parse
	function that matches if at least one of the given functions matches.

	If multiple functions match, then:
	resulting parse function will match the one encountered first
	and emit to outputTree only that function's logic.

*/
function combinatorOr(funcList: Array<ParseFunction>): ParseFunction {

	const resultFunc = function(
		tokens: Readonly<Array<lexer.TokenKind>>,
	 	start: number,
		outputTree: Array<ConstraintTreeNode>,
	): [number, boolean]{
		let maxConsumed = 0;
	
		for (const fn of funcList){
			const [consumed, matched] = fn(tokens, start, outputTree);
			if (matched){
				return [consumed, true];
			}
			maxConsumed = maxConsumed > consumed ? maxConsumed : consumed;
		}

		// ran out of functions
		return [maxConsumed, false];
	
	}
	
	return resultFunc;
}

