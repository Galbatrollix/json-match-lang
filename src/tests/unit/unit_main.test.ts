import * as lexUnitTests from "./lex/unit_lex_all.test.ts"

type unitTestFunc = () => boolean;

// trap for situations where some of imported test files have exported a function
// with wrong signature
const lexTests: Array<unitTestFunc> = Object.values(lexUnitTests);

/*
	Serially executes all unit tests, returns number of unit tests that failed
*/
export function runAllUnitTests(): number {
	const lexFailed: number = runUnitTestsFor(lexTests, "lexer");
	return lexFailed
}


/**
	Runs all unit tests functions provided in test array parameter.
	Some printed messages will use categoryName parameter to convey
	which module tests are for.


	Returns number of unit tests that failed.
*/
function runUnitTestsFor(tests: Array<unitTestFunc>, categoryName: string): number {
	let failedTests = 0;
	let crashedTests = 0;

	console.log(`Running unit tests for ${categoryName}...`)
	for(const testFunc of tests){
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
			console.log(`${categoryName} test: "${testName}" crashed with error: ${error}`);
		}else if (!ok){
			failedTests += 1;
			console.log(`${categoryName} test: "${testName}" failed.`);
		}
	
	}
	if (failedTests){
		console.log(`In total ${failedTests} tests for ${categoryName} failed.`);
	}else{
		console.log(`All ${tests.length} tests for ${categoryName} passed.`);
	}
	
	return failedTests;

}

