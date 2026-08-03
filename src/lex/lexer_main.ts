import {TokenKind} from "./lexer_enum.ts"
import {type MatchToken, lexJsonMatchCodepoints} from "./lexer_impl.ts"

/**
	Immutable output of json match string tokenizer.
	SoA of 4 arrays with .length equal to TokenTape.tokenCount property:
		tokenKind[i]:   TokenKind enum value representing i-th token type
		tokenString[i]: String sliced from original input, that spans range of i-th token
		startIdx[i]:     Char index of original input where i-th token starts
		endIdx[i]:       Char index of original input where i-th token ends, plus one 

	This always is true: with TokenTape as "tt":
		originalInput.slice(tt.startIdx[i], tt.endIdx[i]) === tt.tokenString[i]
		tt.tokenString.join("") === originalInput
		0 <= tt.startIdx[i] <= originalInput.length
		0 <= tt.endIdx[i]   <= originalInput.length
		tt.startIdx[i] === tt.endIdx[i-1]  (for i > 0)
	Char index refers to index in JS string not to code point in unicode sequence.
*/
export type TokenTape = Readonly <{
	tokenCount:   Readonly<number>;

	tokenKind:    Readonly<Array<TokenKind>>;
	tokenString:  Readonly<Array<string>>;
	startIdx:     Readonly<Array<number>>;
	endIdx:       Readonly<Array<number>>;
}>
// autocomplete could behave more sanely if this structure is replaced 
// with interface or with hacks such as, neither is particularly appealing lol
// type NamedAlias<t> = t & { _?: never }

export function tokenizeMatchString(input: string): TokenTape {
	//codepoints are not always length one, cuz surrogate pairs!
	const codepointList: Array<string> = Array.from(input);
	const lexerOutput: Array<MatchToken> = lexJsonMatchCodepoints(codepointList);
	const tape: TokenTape = assembleTokenTable(lexerOutput, codepointList);
	return tape;
}

/**
	Bundle of utility functions for handling TokenTape values.
*/
export namespace tokenTapeUtils {

	/**
		Returns true if TokenTape has at least one error token. 
		Otherwise returns false.
	*/
	export function hasError(tape: TokenTape): boolean {
		for (let i = 0; i< tape.tokenCount; i++){
			if (tape.tokenKind[i] == TokenKind.ERROR){
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
		if (Object.keys(t1).length != 5){
			throw new Error("THIS FUNCTION NEEDS TO BE UPDATED");
		}
		return (
			t1.tokenCount == t2.tokenCount
			&&
			tapeArrayEquals(t1.tokenKind, t2.tokenKind)
			&&
			tapeArrayEquals(t1.tokenString, t2.tokenString)
			&&
			tapeArrayEquals(t1.startIdx, t2.startIdx)
			&&
			tapeArrayEquals(t1.endIdx, t2.endIdx)
		);
	}

	/**
		Contains functions for data presentation
		purposes only. 
	*/
	export namespace display {
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
	}
}


function assembleTokenTable(
	lexerOutput: Array<MatchToken>, codepointList: Array<string>
): TokenTape {
	const resultKinds: Array<TokenKind> = [];
	const resultStrings: Array<string> = [];
	
	for (let i = 1; i < lexerOutput.length; i++){
		const startIdx = lexerOutput[i - 1].endIdx;
		const endIdx = lexerOutput[i].endIdx;
		const kind = lexerOutput[i].kind;
		
		const tokenSlice = codepointList.slice(startIdx, endIdx);
		const tokenString = tokenSlice.join("");
		
		resultKinds.push(kind);
		resultStrings.push(tokenString);
	}
	
	// obtaining input string char ranges
	const {resultStartIdx, resultEndIdx} = tokensToCharRanges(resultStrings);

	// constructing output
	const result: TokenTape = {
		tokenCount: lexerOutput.length - 1,
		tokenKind: Object.freeze(resultKinds),
		tokenString: Object.freeze(resultStrings),
		startIdx: Object.freeze(resultStartIdx),
		endIdx: Object.freeze(resultEndIdx),
	};
	return Object.freeze(result);
}

/**
	Reconstructs index ranges of original input string from
	stream of consecutive tokens string spat out by the tokenizer.
	Returned as SOA {resultStartIdx[i], resultEndIdx[i]}
*/
function tokensToCharRanges(tokenStrings: Array<string>): {
	resultStartIdx: Array<number>, resultEndIdx: Array<number>
}{
	if (tokenStrings.length == 0){
		return {resultStartIdx: [], resultEndIdx: []};
	}
	
 	let previous = tokenStrings[0].length;
	const start: Array<number> = [0];
	const end: Array<number> = [previous];
	for (let i = 1; i < tokenStrings.length; i++){
		const current = tokenStrings[i].length + previous;
		start.push(previous);
		end.push(current);
		previous = current;
	}
	return {resultStartIdx: start, resultEndIdx: end};
}

/*
	Print helpers
*/

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

/*
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