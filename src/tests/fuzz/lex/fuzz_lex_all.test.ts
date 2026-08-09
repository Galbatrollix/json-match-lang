import {lexer} from "../../../main.ts"
import {randomInRange, randomString, dumpStringToUniqueFile} from "../fuzz_helpers.test.js"


/**
	Bombards lexer with completely random inputs and checks whether
	it doesnt crash and produces a well-formed output.
*/
export function lexFuzzRandomStringInputs(batchSize: number, logDirPath: string): number {
	const maxStringLength = 5000;

	let failures = 0;

	for (let i = 0; i < batchSize; i++){
		const input: string = randomString(randomInRange([0, maxStringLength]));
		
		let fail: boolean = false;
		try {
			const tape: lexer.TokenTape = lexer.tokenizeMatchString(input);
			fail = ! lexer.tapeUtils.debug.integrityCheckFull(tape, input);
		}catch(e){
			fail = true;
		}
		if (fail){
			failures += 1;
			dumpStringToUniqueFile(logDirPath, lexFuzzRandomStringInputs.name, input);
		}
	}
	return failures;
}