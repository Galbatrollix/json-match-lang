import {TokenKind} from "./lexer_enum.ts"
import {type PathToken, lexJsonPathString} from "./lexer_impl.ts"


export type JsonPathTokenized = {
	tokenKinds: Readonly<Array<TokenKind>>;
	tokenStrings: Readonly<Array<string>>;
}

export function tokenizeJsonPathString(input: string): Readonly<JsonPathTokenized> {
	//codepoints are not always length one, cuz surrogate pairs!
	const codepointList: Array<string> = Array.from(input);
	const lexed: Array<PathToken> = lexJsonPathString(codepointList);
		
	const resultKinds: Array<TokenKind> = [];
	const resultStrings: Array<string> = []; 
	
	for (let i = 1; i < lexed.length; i++){
		const startIdx = lexed[i - 1].endIdx;
		const endIdx = lexed[i].endIdx;
		const kind = lexed[i].kind;
		
		const tokenSlice = codepointList.slice(startIdx, endIdx);
		const tokenString = tokenSlice.join("");
		
		resultKinds.push(kind);
		resultStrings.push(tokenString);		
	}

	const result: JsonPathTokenized  = {
		tokenKinds: Object.freeze(resultKinds),
		tokenStrings: Object.freeze(resultStrings),
	};
	return Object.freeze(result);
	
}

export function tokenizedPrettyPrint(tokenized: Readonly<JsonPathTokenized>): string{
	const toJoin: Array<string> = [];
	
	for(const i in tokenized.tokenKinds){
		const kind = tokenized.tokenKinds[i];
		const kindString = TokenKind[kind];
		let tokenString = tokenized.tokenStrings[i];
		if (kind == TokenKind.WHITESPACE){
			tokenString = "";
		}

		toJoin.push(`${i.toString().padEnd(5, " ")} kind: ${kindString.padEnd(28, " ")}token: ${tokenString}`);
	}
	
	return toJoin.join("\n");
}