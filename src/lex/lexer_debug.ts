import {type TokenTape, tokenizeMatchString, tokenTapeUtils} from "./lexer_main.ts"
import {TokenKind} from "./lexer_enum.ts"



export namespace debug {
	export function integrityCheckBasic(tape: TokenTape): boolean {
		return soaOk(tape) && stringsOk(tape) && noDupeErrors(tape);
	}	

	export function integrityCheckDeep(tape: TokenTape): boolean {
		return integrityCheckBasic(tape) && recursiveOk(tape);
	}
	
	export function integrityCheckFull(tape: TokenTape, originalInput: string): boolean {
		return (
			integrityCheckDeep(tape) 
			&& 
			stringSumOk(tape, originalInput)
			&&
			tokenizeAgainOk(tape, originalInput)
		);
	}
	
	/**
		Returns true only if TokenTape SoA structure is consistent.	
	*/
	export function soaOk(tape: TokenTape): boolean {
		return (
			tape.tokenCount == tape.tokenKind.length
			&&
			tape.tokenCount == tape.tokenString.length
			&&
			tape.tokenCount == tape.startIdx.length
			&&
			tape.tokenCount == tape.endIdx.length
		);
	}
	
	/**
		Returns true only if no error tokens exist within the tape
		in neighborhood of other error tokens.
	*/
	export function noDupeErrors(tape: TokenTape): boolean {
		if (tape.tokenCount < 2) return true;

		for (let i = 1; i < tape.tokenCount; i++){
			const left = tape.tokenKind[i-1];
			const right = tape.tokenKind[i];
			if (left == TokenKind.ERROR && right == TokenKind.ERROR) {
				return false;
			}
		}

		return true;
	}

	/**
		Returns true only if contents of string and indexes arrays are consistent.
	*/
	export function stringsOk(tape: TokenTape): boolean {
		let accumulatedLength = 0;

		for (let i = 0; i < tape.tokenCount; i++) {
			const strlen = tape.tokenString[i].length;
		
			const expectedStart = accumulatedLength;
			const expectedEnd = accumulatedLength + strlen; 
			if (expectedStart != tape.startIdx[i] || expectedEnd != tape.endIdx[i]){
				return false;
			}
			accumulatedLength += strlen;
		}
		return true;
	}


	/**
		Returns true only if all tokens of the tape
		parse into themselves when fed to the tokenizer.
	*/
	export function recursiveOk(tape: TokenTape): boolean {
		for (let i = 0; i<tape.tokenCount ;i++) {
			const s = tape.tokenString[i];
			const recursiveTape = tokenizeMatchString(s);
			if (recursiveTape.tokenCount != 1 || recursiveTape.tokenString[0] != s){
				// console.log(`FAILED AT STRING: ${i}: ${s}`);
				// console.log("GOT: ", recursiveTape);
				return false;
			}
		}

		return true;
	}

	/**
		Returns true only if contents of tape strings sum up to the original input string.
	*/
	export function stringSumOk(tape: TokenTape, originalInput: string): boolean {
		return tape.tokenString.join("") == originalInput;
	}
	
	/**
		Returns true only if original input yields 
		exactly the same tape when tokenized again
	*/
	export function tokenizeAgainOk(tape: TokenTape, originalInput: string): boolean {
		const tokenizedAgain = tokenizeMatchString(originalInput);

		return tokenTapeUtils.equals(tape, tokenizedAgain);
		
	}
}

