import * as lexFuzzTests from "./lex/fuzz_lex_all.test.ts"

type fuzzerFunc = (batchSize: number, logDirPath: string) => number;

// trap for situations where some of imported test files have exported a function
// with wrong signature
const lexFuzzers: Array<fuzzerFunc> = Object.values(lexFuzzTests);

let totalFailures = 0;
/**	
	Runs all fuzz tests in pararell, for ever.

	(Not really in pararell at least not yet, might be done with worker threads)
	In reality, each fuzzer is ran round-robin style, executting for 
	<batch size> iterations before passing control to next fuzzer.

	This function never returns and must be halted by outside means. 
*/
export function runAllFuzzTests(
	batchSize: number = 10000, 
	logDirPath: string = "temp/tests/dumps",
): never {
	console.log(`Running all fuzzers in parallel...`);

	for(;;){
		for (const fuzzer of lexFuzzers){
			const fuzzName = fuzzer.name;

			const failures: number = fuzzer(batchSize, logDirPath);
			totalFailures += failures;

			if (failures != 0){
				console.log(
					`Fuzzer ${fuzzName} found ${failures} failures.\n`+
					`Faulty inputs dumped into log files in directory: ${logDirPath}`
				);
			}else if(totalFailures == 0){
				console.log(
					`Batch of ${batchSize} iterations completed for` +
					` fuzzer ${fuzzName} with no failures.`
				);
			}
		}
	}
}