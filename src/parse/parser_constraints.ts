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

	const [consumed, success] = parseOrBlock(tokens, start, dummyTreeNode);
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

const parseTerm: ParseFunction = combinatorOr(
	[parseNegation, parseAtom, parseParenthesizedBlock]
);

/**
	Assembles parse logic for paretnehsized-block parse function
	but doesnt handle the output tree transforms,
	that is left for the main function.
*/
const parseParenthesizedBlockInternal: ParseFunction = combinatorChain([
	createSingleTokenParse(lexer.TokenKind.PARENTHESIS_LEFT),
	parseOrBlock, 
	createSingleTokenParse(lexer.TokenKind.PARENTHESIS_RIGHT),
]);

function parseParenthesizedBlock(
	tokens: Readonly<Array<lexer.TokenKind>>,
 	start: number,
	outputTree: Array<ConstraintTreeNode>,
): [number, boolean] {
	const childTree: Array<ConstraintTreeNode> = [];
	const [consumed, matched] = parseParenthesizedBlockInternal(tokens, start, childTree);
	
	if (! matched){
		return [consumed, false];
	}
	
	// inner function matched, construct output
	const newNode: ConstraintTreeNode = {
		kind: ConstraintTreeNodeKind.PARENS,
		range: [start, start + consumed],
		children: childTree,
	}
	outputTree.push(newNode);
	
	return [consumed, true];
}


const parseAndOperator: ParseFunction = createSingleTokenParse(
	lexer.TokenKind.OPERATOR_AND,
);

/**
	Assembles parse logic for and-block parse function
	but doesnt handle the output tree transforms,
	that is left for the main function.
*/
const parseAndBlockInternal: ParseFunction = combinatorChain([
	parseTerm,
	combinatorOptionalRepeat(combinatorChain(
		[parseAndOperator, parseTerm],
	)),
]);

function parseAndBlock(
	tokens: Readonly<Array<lexer.TokenKind>>,
 	start: number,
	outputTree: Array<ConstraintTreeNode>,
): [number, boolean] {
	const childTree: Array<ConstraintTreeNode> = [];
	const [consumed, matched] = parseAndBlockInternal(tokens, start, childTree);
	
	if (! matched){
		return [consumed, false];
	}

	// inner function matched, construct output
	const newNode: ConstraintTreeNode = {
		kind: ConstraintTreeNodeKind.AND,
		range: [start, start + consumed],
		children: childTree,
	}
	outputTree.push(newNode);
	
	return [consumed, true];
}

const parseOrOperator: ParseFunction = createSingleTokenParse(
	lexer.TokenKind.OPERATOR_OR,
);

/**
	Assembles parse logic for or-block parse function
	but doesnt handle the output tree transforms,
	that is left for the main function.
*/
const parseOrBlockInternal: ParseFunction = combinatorChain([
	parseAndBlock,
	combinatorOptionalRepeat(combinatorChain(
		[parseOrOperator, parseAndBlock],
	)),
]);

function parseOrBlock(
	tokens: Readonly<Array<lexer.TokenKind>>,
 	start: number,
	outputTree: Array<ConstraintTreeNode>,
): [number, boolean] {
	const childTree: Array<ConstraintTreeNode> = [];
	const [consumed, matched] = parseOrBlockInternal(tokens, start, childTree);
	
	if (! matched){
		return [consumed, false];
	}
	
	// inner function matched, construct output
	const newNode: ConstraintTreeNode = {
		kind: ConstraintTreeNodeKind.OR,
		range: [start, start + consumed],
		children: childTree,
	}
	outputTree.push(newNode);
	
	return [consumed, true];
}




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
	
	const childTree: Array<ConstraintTreeNode> = [];
	
	const [consumed, matched] = parseParenthesizedBlockOrAtom(
		tokens,
		start + 1,
		childTree,
	);
	
	if (! matched){
		// rollback output tree
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

	Below live generic parser combinators and generator functions
	- building blocks for actual parsers above.

*/




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

/*
	Parser combinator that tranforms an array of parse functions into a single parse
	function that matches if all provided functions match in provided order
	one, after another.

	Function may modify outputTree array, but if it fails, changes (if any)
	are guaranteed to rollback to original state.
*/
function combinatorChain(funcList: Array<ParseFunction>): ParseFunction {
	// alias for length reassign operation so its obvious what it is
	function rollbackTree(outputTree: Array<ConstraintTreeNode>, initialLength: number){
		outputTree.length = initialLength;
	}

	const resultFunc = function(
		tokens: Readonly<Array<lexer.TokenKind>>,
	 	start: number,
		outputTree: Array<ConstraintTreeNode>,
	): [number, boolean]{
		const initialTreeLength = outputTree.length;

		let at = start;		
		for (let fnIndex = 0; fnIndex < funcList.length; fnIndex++) {
			const [consumed, matched] = funcList[fnIndex](tokens, at, outputTree);
			if (! matched){
				rollbackTree(outputTree, initialTreeLength);
				return [at - start + consumed, false];
			}
			at += consumed;
		}
		
		// all functions passed
		const consumedTotal = at - start;
		return [consumedTotal, true];
	}
	return resultFunc;
}


/**
	Parser combinator that tranforms a single parse function into a new
	function that attempts to repeatedly match function provided as parameter
	until it fails.

	In other words, matches a n-lengthed chain of given functions (n >= 0)
	always matches longest possible sequence,

	Since empty sequence is a 0-length match,
	resulted function is incapable of failing.

*/
function combinatorOptionalRepeat(func: ParseFunction): ParseFunction {

	const resultFunc = function(
		tokens: Readonly<Array<lexer.TokenKind>>,
		start: number,
		outputTree: Array<ConstraintTreeNode>,
	): [number, boolean]{
		let matched: boolean = false;
		let consumedTotal: number = 0;
		for(;;){
			const result = func(tokens, start + consumedTotal, outputTree);
			matched = result[1];
			if (! matched){
				break;
			}
			consumedTotal += result[0];
		}

		return [consumedTotal, true];
	}
	return resultFunc;
}



/**
	Parser generator that creates a parse function
	that consumes exactly 1 specific token on success
	or does nothing on failure. Never modifies AST.
*/
function createSingleTokenParse(token: lexer.TokenKind): ParseFunction {
	const resultFunc = function(
		tokens: Readonly<Array<lexer.TokenKind>>,
	 	start: number,
		outputTree: Array<ConstraintTreeNode>,
	): [number, boolean]{
		//@ts-ignore
		const _unused = outputTree;
		
		if (start == tokens.length){
			return [0, false];
		}
		
		const matched: boolean = tokens[start] == token;
		if (matched){
			return [1, true];
		}else{
			return [0, false];
		}
	
	}
	return resultFunc
}