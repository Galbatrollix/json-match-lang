import {type TokenTape, tokenizeExpressionString, utils} from "./lexer_tape.ts"
import {TokenKind, TokenKindUtils} from "./lexer_enum.ts"




export function integrityCheckBasic(tape: TokenTape): boolean {
	return (
		soaOk(tape) 
		&& 
		noDupeErrors(tape)
		&&
		incomplesOnlyInLastSlot(tape)
	);
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
function soaOk(tape: TokenTape): boolean {
	return (
		tape.tokenCount == tape.tokenKind.length
		&&
		tape.tokenCount == tape.tokenString.length
	);
}

/**
	Returns true only if no error tokens exist within the tape
	in neighborhood of other error tokens. Only considers plain
	error tokens. Ignores incomplete-error tokens.
*/
function noDupeErrors(tape: TokenTape): boolean {
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
	Returns true only if no incomplete-error token
	is at the list position other than last. 
*/
function incomplesOnlyInLastSlot(tape: TokenTape): boolean {
	for (let i = 0; i < tape.tokenCount - 1; i++){
		const kind: TokenKind = tape.tokenKind[i];
		if (TokenKindUtils.isErrorIncomplete(kind)){
			return false;
		}
	}
	return true;
}



/**
	Returns true only if all tokens of the tape
	parse into themselves when fed to the tokenizer.
	
	An exception to that rule are Erorr tokens that may parse 
	into an error token and error incomplete token pair or
	just an error incomplete token.
*/
function recursiveOk(tape: TokenTape): boolean {
	for (let i = 0; i<tape.tokenCount ;i++) {
		const s = tape.tokenString[i];
		const kind = tape.tokenKind[i];
		
		const recursiveTape = tokenizeExpressionString(s);

		if (TokenKindUtils.isError(kind)){

			// possible case where error is split into error and incomplete
			const twoElementsCase: boolean = (
				recursiveTape.tokenCount == 2
				&&
				recursiveTape.tokenString.join("") == s
				&&
				recursiveTape.tokenKind[0] == TokenKind.ERROR
				&&
				TokenKindUtils.isErrorIncomplete(recursiveTape.tokenKind[1])
			);
			// possible case where error is not split but might become an incomplete
			const oneElementCase: boolean = (
				recursiveTape.tokenCount == 1
				&&
				recursiveTape.tokenString[0] == s
				&& 
				TokenKindUtils.isError(recursiveTape.tokenKind[0])
			);
			
			// if neither one or two elements variant happened then something is wrong
			if (!oneElementCase && !twoElementsCase){
				return false;
			}
			
		}else if ( 
			recursiveTape.tokenCount != 1 
			|| recursiveTape.tokenString[0] != s
			|| recursiveTape.tokenKind[0] != kind 
		){
			// console.log(`FAILED AT STRING: ${i}: ${s}`);
			// console.log("GOT: ", recursiveTape);
			// console.log("Fault at token:" + String(i));
			return false;
		}
	}

	return true;
}

/**
	Returns true only if contents of tape strings sum up to the original input string.
*/
function stringSumOk(tape: TokenTape, originalInput: string): boolean {
	return tape.tokenString.join("") == originalInput;
}

/**
	Returns true only if original input yields 
	exactly the same tape when tokenized again
*/
function tokenizeAgainOk(tape: TokenTape, originalInput: string): boolean {
	const tokenizedAgain = tokenizeExpressionString(originalInput);

	return utils.misc.equals(tape, tokenizedAgain);
}


