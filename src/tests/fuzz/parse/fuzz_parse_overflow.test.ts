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
	] = resetComplicatedString();

	let failures = 0;

	for (let i = 0; i < batchSize; i++){
		if (smallestFailingDepth - largestPassingDepth <= 1){
			[largestPassingString,largestPassingDepth, smallestFailingDepth] = resetComplicatedString();
		}

		const depthToTest = Math.floor((smallestFailingDepth - largestPassingDepth) / 2) + largestPassingDepth;
		const stringToTest = makeComplicatedConstraintString(
			depthToTest, largestPassingString, largestPassingDepth,
		);	
		console.log(/*stringToTest, */depthToTest);
		const tokenTape: lexer.TokenTape = lexer.tokenizeExpressionString(
			stringToTest
		);
		
		let fail: boolean = false;
		try {
			var parseResult = parser.parseExpressionTokens(tokenTape);
		}catch(e){
			fail = true;
		}
		

		if (fail){
			failures += 1;
			dumpStringToUniqueFile(
				logDirPath,
				parseFuzzStackOverflow.name,
				stringToTest,
			);

			[largestPassingString,largestPassingDepth, smallestFailingDepth] = resetComplicatedString();
		}
		// if stack overflow properly reported, modify smallest failing,
		// otherwise if passed - modify largest passing.
		//@ts-expect-error
		else if (parseResult.errors.length){
			smallestFailingDepth = depthToTest;
		}else{
			largestPassingDepth = depthToTest;
			largestPassingString = stringToTest;
		}
	
	}
	return failures;
}


function resetComplicatedString(): [string, number, number] {
	const startingRange = [1, 100000];
	return ["seed", startingRange[0], startingRange[1]];
};

/**
	Creates a constraint-only expression string with depth approximately
	equal to depth parameter. Tree can branch but its lateral grow is limited
	to not run out of memory.
*/
function makeComplicatedConstraintString(
	depth: number, prevString: string, prevDepth: number
): string {
	
	return growComplicatedString(prevString, depth - prevDepth);
}

function growComplicatedString(previous: string, additionalDepth: number): string {
	const prefixReversed: Array<string> = [];
	const postfix: Array<string> = [];

	for (let i = 0; i < additionalDepth; i++){
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

	return prefixReversed.reverse().join('') + previous + postfix.join('');
}
