import {lexer} from "../../../main.ts"
import {parser} from "../../../main.ts"
import {
	randomInRange,
	dumpStringToUniqueFile,
} from "../fuzz_helpers.test.js"


/**
	Tries to perform a "binary search esque" traversal of the parser input space.
	The goal is to find a boundary between inputs that cause a stack overflow error
	and inputs that parse properly. 

	By repeatedly poking the boundary, this function attempts to find an uncaught
	stack overflow error that may cause the parser to crash.
*/
export function parseFuzzStackOverflow(batchSize: number, logDirPath: string): number {
	let [
		largestPassingString,
		largestPassingDepth,
		smallestFailingDepth,
		chosenDepthStrategy,
	] = resetComplicatedString();

	for (let i = 0; i < batchSize; i++){
		if (smallestFailingDepth - largestPassingDepth <= 1){
			[largestPassingString,
			 largestPassingDepth, 
			 smallestFailingDepth,
			 chosenDepthStrategy,] = resetComplicatedString();
		}

		const depthToTest = Math.floor((smallestFailingDepth - largestPassingDepth) / 2) + largestPassingDepth;
		const stringToTest = makeComplicatedConstraintString(
			depthToTest, largestPassingString, largestPassingDepth, chosenDepthStrategy,
		);	

		//console.log(depthToTest);
	
		const tokenTape: lexer.TokenTape = lexer.tokenizeExpressionString(
			stringToTest
		);
		
		try {
			var parseResult = parser.parseExpressionTokens(tokenTape);
		}catch(e){
			dumpStringToUniqueFile(
				logDirPath,
				parseFuzzStackOverflow.name,
				stringToTest,
			);
			
			return 1;
		}
		
		// if stack overflow properly reported, modify smallest failing,
		// otherwise if passed - modify largest passing.

		if (parseResult.errors.length){
			smallestFailingDepth = depthToTest;
		}else{
			largestPassingDepth = depthToTest;
			largestPassingString = stringToTest;
		}
	
	}
	return 0;
}

/**
	Conscruting deeply recursive string can be done with 
	one of the following strategies.
*/
enum DepthStrategy {
	ONLY_NOT = 0,
	ONLY_PARENS = 1,
	PARENS_AND_NOT = 2, 
	MIXED = 3,
}
const depthStrategyCount = 4;


/**
	Resets overflow boundary binary search state  back to square one.
	Make sure the overflow boundary lies somewhere in the starting range.
*/
function resetComplicatedString(): [string, number, number, DepthStrategy] {
	const startingRange = [1, 30000];
	const strategy = randomInRange([0, depthStrategyCount]);

	return ["seed", startingRange[0], startingRange[1], strategy];
};

/**
	Creates a constraint-only expression string with depth approximately
	equal to depth parameter.

	Returned string is built on top of a given "prevString" and its "prevDepth"
	depth value.
		
	Depth strategy selects an algorithm for growing the tree depth.
		
 	The constraint tree in returned string can branch 
	but its lateral grow is highly limited to not run out of memory.
*/
function makeComplicatedConstraintString(
	depth: number, prevString: string, prevDepth: number, strategy: DepthStrategy,
): string {
	const depthDeficit = depth - prevDepth;

	const [prefixReversed, postfix] = growFunctions[strategy](depthDeficit);
	
	return prefixReversed.reverse().join('') + prevString + postfix.join('');
}



/**
	Associates each value of enum DepthStrategy with a function that
	generates a prefix and suffix to a string in order to make it N steps deeper.
*/
const growFunctions = {
	[DepthStrategy.ONLY_NOT]:       growDepthOnlyNot,
	[DepthStrategy.ONLY_PARENS]:    growDepthOnlyParens,
	[DepthStrategy.PARENS_AND_NOT]: growDepthParensNot,
	[DepthStrategy.MIXED]:          growDepthMixed,
} as const;

function growDepthOnlyNot(depth: number): [Array<string>, Array<string>] {
	const prefixReversed: Array<string> = [];
	const postfix: Array<string> = [];

	for (let i = 0; i < depth; i++){
		prefixReversed.push('!');
	}

	return [prefixReversed, postfix];
}

function growDepthOnlyParens(depth: number): [Array<string>, Array<string>] {
	const prefixReversed: Array<string> = [];
	const postfix: Array<string> = [];

	for (let i = 0; i < depth; i++){
		prefixReversed.push('(');
		postfix.push(')');
	}

	return [prefixReversed, postfix];
}

function growDepthParensNot(depth: number): [Array<string>, Array<string>] {
	const prefixReversed: Array<string> = [];
	const postfix: Array<string> = [];

	for (let i = 0; i < depth; i++){
		const which = randomInRange([0, 2]);

		switch (which){
		case 0:  // NOT
			prefixReversed.push('!');
			break;
		default: // PARENTHESIS
			prefixReversed.push('(');
			postfix.push(')');
			break;
		}
	}

	return [prefixReversed, postfix];
}

function growDepthMixed(depth: number): [Array<string>, Array<string>] {
	const prefixReversed: Array<string> = [];
	const postfix: Array<string> = [];

	for (let i = 0; i < depth; i++){
		const which = randomInRange([0, 4]);

		switch (which){
		case 0:  // NOT
			prefixReversed.push('!');
			break;
		case 1:  // OR
			postfix.push('|');
			postfix.push('ATOM');
			break;
		case 2:  // AND
			prefixReversed.push('&');
			prefixReversed.push('atom');
			break;
		default: // PARENTHESIS
			prefixReversed.push('(');
			postfix.push(')');
			break;
		}
	}

	return [prefixReversed, postfix];
}