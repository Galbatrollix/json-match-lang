import * as lexUnitTests from "./lex/unit_lex_all.test.ts"

type unitTestFunc = () => boolean;

// trap for situations where some of imported test files have exported a function
// with wrong signature
const lexTests: Array<unitTestFunc> = Object.values(lexUnitTests);

/*
	Serially executes all unit tests, returns number of unit tests that failed

	//todo Refactor once parser tests arrive.
*/
export function runAllUnitTests(): number {
	let failedTests = 0;
	let crashedTests = 0;

	console.log("Running unit tests for lexer...")
	for(const testFunc of lexTests){
		const testName = testFunc.name;
		
		let ok: boolean = false;
		let error: any = undefined;
		let errorCaught: boolean = false;
		try {
			ok = testFunc();
		}catch (e){
			error = e;
			errorCaught = true;
		}
		
		if (errorCaught) {
			crashedTests += 1;
			failedTests += 1;
			console.log(`Lex test: "${testName}" crashed with error: ${error}`);
		}else if (!ok){
			failedTests += 1;
			console.log(`Lex test: "${testName}" failed.`);
		}
	
	}
	if (failedTests){
		console.log(`In total ${failedTests} tests for lexer failed.`)	
	}else{
		console.log(`All tests for lexer passed.`)
	}
	
	return failedTests;
}


