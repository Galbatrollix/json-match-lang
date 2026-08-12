import {type TokenTape} from "./lexer_tape.ts"
import {type MatchToken, lexExpressionCodepoints} from "./lexer_impl.ts"
import {TokenKind} from "./lexer_enum.ts"


export function tokenizeExpressionString(input: string): TokenTape {
	//codepoints are not always length one, cuz surrogate pairs!
	const codepointList: Array<string> = Array.from(input);
	const lexerOutput: Array<MatchToken> = lexExpressionCodepoints(codepointList);
	return assembleTokenTape(lexerOutput, codepointList);
}


function assembleTokenTape(
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
	
	// constructing output
	const result: TokenTape = {
		tokenCount: lexerOutput.length - 1,
		tokenKind: Object.freeze(resultKinds),
		tokenString: Object.freeze(resultStrings),
	};
	return Object.freeze(result);
}