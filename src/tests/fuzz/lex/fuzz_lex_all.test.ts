import {lexer} from "../../../main.ts"
import {
	randomInRange,
	randomAsciiString,
	randomUnicodeString,
	dumpStringToUniqueFile,
} from "../fuzz_helpers.test.js"


/**
	Bombards lexer with completely random inputs and checks whether
	it doesnt crash and produces a well-formed output.
*/
export function lexFuzzRandomUnicodeStringInputs(batchSize: number, logDirPath: string): number {
	const maxStringLength = 5000;

	let failures = 0;

	for (let i = 0; i < batchSize; i++){
		const input: string = randomUnicodeString(randomInRange([0, maxStringLength]));
		
		let fail: boolean = false;
		try {
			const tape: lexer.TokenTape = lexer.tokenizeExpressionString(input);
			fail = ! lexer.TokenTapeUtils.Debug.integrityCheckFull(tape, input);
		}catch(e){
			fail = true;
		}
		if (fail){
			failures += 1;
			dumpStringToUniqueFile(logDirPath, lexFuzzRandomUnicodeStringInputs.name, input);
		}
	}
	return failures;
}

/**
	Bombards lexer with completely random inputs within
	ascii character range and checks whether
	it doesnt crash and produces a well-formed output.
*/
export function lexFuzzRandomAsciiStringInputs(batchSize: number, logDirPath: string): number {
	const maxStringLength = 500;

	let failures = 0;

	for (let i = 0; i < batchSize; i++){
		const input: string = randomAsciiString(randomInRange([0, maxStringLength]));
		
		let fail: boolean = false;
		try {
			const tape: lexer.TokenTape = lexer.tokenizeExpressionString(input);
			fail = ! lexer.TokenTapeUtils.Debug.integrityCheckFull(tape, input);
		}catch(e){
			fail = true;
		}
		if (fail){
			failures += 1;
			dumpStringToUniqueFile(logDirPath, lexFuzzRandomUnicodeStringInputs.name, input);
		}
	}
	return failures;
}