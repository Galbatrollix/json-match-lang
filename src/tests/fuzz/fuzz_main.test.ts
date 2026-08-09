/**	
	Runs all fuzz tests in pararell, for ever.

	(Not really in pararell at least not yet, might be done with worker threads)
	In reality, each fuzzer is ran round-robin style, executting for 
	<batch size> iterations before passing control to next fuzzer.

	This function never returns and must be halted by outside means. 
*/
export function runAllFuzzTests(batchSize: number, logDirPath: string): void {
	// for(;;);
}