import {TokenKind, TokenKindUtils} from "./lexer_enum.ts"
import {tokenizeExpressionString} from "./lexer_tokenize.ts"

/**
	Immutable output of expression string tokenizer.
	SoA of 2 arrays with .length equal to TokenTape.tokenCount property:
		tokenKind[i]:   TokenKind enum value representing i-th token type
		tokenString[i]: String sliced from original input, that spans range of i-th token

	This always is true: with TokenTape as "tt":
		tt.tokenString.join("") === originalInput
*/
export type TokenTape = Readonly <{
	tokenCount:   number;

	tokenKind:    Readonly<Array<TokenKind>>;
	tokenString:  Readonly<Array<string>>;
}> & { _?: never };


/**
	Bundle of utility functions for handling TokenTape values.
*/
export namespace TokenTapeUtils {
	/**
		Contains general purpose utility functions such as
		comparing two tapes or checking if tape has error.
	*/
	export namespace Misc {
		/**
			Returns true if TokenTape has at least one error token. 
			Otherwise returns false.
		*/
		export function hasErrors(tape: TokenTape): boolean {
			for (let i = 0; i< tape.tokenCount; i++){
				if (TokenKindUtils.isError(tape.tokenKind[i])){
					return true;
				}
			}
			return false;
		}
		
		/**
			Returns true only if given token tapes are identical
		*/
		export function equals(t1: TokenTape, t2: TokenTape): boolean{
	        // its more practical to make a guard for potential new properties 
			// than to try to make this function future-proof.
			if (Object.keys(t1).length != 3){
				throw new Error("THIS FUNCTION NEEDS TO BE UPDATED");
			}
			return (
				t1.tokenCount == t2.tokenCount
				&&
				tapeArrayEquals(t1.tokenKind, t2.tokenKind)
				&&
				tapeArrayEquals(t1.tokenString, t2.tokenString)
			);
		}

		/**
			A helper for comparing tape pararell arrays for equality. 
			Returns true if both are equal
		*/
		function tapeArrayEquals<T>(arr1: Readonly<Array<T>>, arr2: Readonly<Array<T>>): boolean {
			if (arr1.length != arr2.length){
				return false;
			}

			for (let i = 0; i < arr1.length; i++){
				if (arr1[i] != arr2[i]){
					return false;
				}
			}

			return true;
		}

	}
	
	/**
		Contains functions for data presentation
		purposes only. 
	*/
	export namespace Display {
		/**
			Returns token tape encoded as array of strings, with each
			string corresponding to one tokentape entry.
		*/
		export function asArr(tape: TokenTape): Array<string> {
			const result: Array<string> = [];

			const numberPad = (tape.tokenKind.length - 1).toString().length + 2;
			const kindPad = 23;
			const kindTruncate = 21;
			const totalPad = 60;

			const maxTokenChars = totalPad - kindPad - 13;
		
			for(const i in tape.tokenKind){
				const kind = tape.tokenKind[i];
				const kindString = TokenKind[kind]
				let tokenString = tape.tokenString[i];
				if (kind == TokenKind.WHITESPACE){
					tokenString = "";
				}
				

				const processedTokenString = truncateStrWithEllipsis(tokenString, maxTokenChars);
			
				
				const entry = `${
					i.toString().padEnd(numberPad, " ")
				}kind: ${
					truncateStr(kindString, kindTruncate).padEnd(kindPad, " ")
				}token: ${processedTokenString}`.padEnd(totalPad, " ");
			
				result.push(entry);
			}
			
			return result;
		}
		
		/**
			Returns token tape encoded as a single string with line
			separators. Mainly for printing in console.
		*/
		export function asStr(tape: TokenTape): string {
			const entries: Array<string> = asArr(tape);
			for(const i in entries){
				entries[i] = replaceWhitespaceWithSpaces(entries[i]);
			}
			return entries.join("\n");
		}
		
		/**
			Returns token tape encoded as HTML for display with syntax highlight
			and whatnot. Troublesome characters are replaced with escape sequences
			for the text to be injectable with a simple .innerHTML call

			With string string token "T" and with its tokenKind as "K":
			Then, with:  TokenKind[K] as "KINDIDENTIFIER"
			Then, with escaped "T" as "ESCAPED_T"
			
			Each token renders as such:
			<span class=KINDIDENTIFIER>ESCAPED_T</span>
			Span items are joined with no whitespace inbetween.
		*/
		export function asHtml(tape: TokenTape): string {
			function escapeHtml(unsafe: string) {
			  return unsafe
			    .replace(/&/g, "&amp;")
			    .replace(/</g, "&lt;")
			    .replace(/>/g, "&gt;")
			    .replace(/"/g, "&quot;")
			    .replace(/'/g, "&#039;");
			};
			const spanList: Array<string> = [];
			for (let i = 0; i < tape.tokenCount; i++){
				const kindIdentifier: string = TokenKind[tape.tokenKind[i]];
				const escapedToken: string = escapeHtml(tape.tokenString[i]);
				spanList.push(`<span class=${kindIdentifier}>${escapedToken}</span>`);
			}
			return spanList.join("");
		}
		/**
		 	Exports tokenkinds of TokenTape as a string that represents 
			JS array that could be plucked directly into code. 

			Each tokenkind string identifier is prepended with value of prefix parameter.
			If prefix is not specified, prepends nothing.
		
			Example output with "tk." prefix:
				 "[tk.WHITESPACE, tk.ERROR, tk.OPERATOR_AND, ]"
		*/
		export function asReadableKinds(
			kinds: Readonly<Array<TokenKind>>,
			prefix: string = "",
		): string {
			const toJoin: Array<string> = ['['];
			for (let i = 0; i < kinds.length; i++){
				const kindIdentifier: string = TokenKind[kinds[i]];
				toJoin.push(prefix);
				toJoin.push(kindIdentifier);
				toJoin.push(", ");
			}	
			toJoin.push(']');

			return toJoin.join("")

		}

		function truncateStr(s: string, maxLength: number): string {
			return s.slice(0, maxLength);
		}

		// max length must be at least 7.
		function truncateStrWithEllipsis( s: string, maxLength: number): string {
			if (maxLength < 7){
				return s;
			}
			if (s.length <= maxLength){
				return s;
			}
			// s is too long
			const sliced = s.slice(0, maxLength - 5);
			return sliced + "(...)";
		}
			
		function replaceWhitespaceWithSpaces(s: string): string {
			return s.replace(/[\f\n\r\t\v\u00A0\u2028\u2029]/g, " ");
		}
		
	}


	export namespace Debug {
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

			return TokenTapeUtils.Misc.equals(tape, tokenizedAgain);
		}

	}

}
