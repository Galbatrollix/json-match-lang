/**
	All functions in this file should be ()=> boolean
	They are automatically reexported via unit_lex_all.test.ts file
*/

import {lexer} from "../../../main.ts"


/**
	Checks if empty string properly parses into empty token tape.
*/
export function lexTestEmptyString(): boolean {
	const empty = '';
	const output: lexer.TokenTape = lexer.tokenizeMatchString(empty);
	
	const integrityOk: boolean = lexer.tapeUtils.debug.integrityCheckFull(output, empty);
	if (!integrityOk){
		return false;
	}
	
	if (output.tokenCount != 0){
		return false;
	}

	return true;	
}

const atomCollection: Record<lexer.TokenKind, Array<string> > = {
	[lexer.TokenKind.ERROR]: [",,,", "...", "\\//"],
	[lexer.TokenKind.WHITESPACE]: [' ', '  ', "\n\r\t"],

	[lexer.TokenKind.OPERATOR_CHILD]: ['>'],
	[lexer.TokenKind.OPERATOR_PARENT]: ['<'],
	[lexer.TokenKind.OPERATOR_SIBLING_NEXT]: ['+'],
	[lexer.TokenKind.OPERATOR_SIBLING_PREV]: ['-'],
	[lexer.TokenKind.OPERATOR_SIBLING_SUBSEQUENT]: ['++'],
	[lexer.TokenKind.OPERATOR_SIBLING_PRECEDING]: ['--'],
	[lexer.TokenKind.OPERATOR_SIBLING_ANY]: ['~'],
	[lexer.TokenKind.OPERATOR_OR]: ['|'],
	[lexer.TokenKind.OPERATOR_AND]: ['&'],
	[lexer.TokenKind.OPERATOR_NOT]: ['!'],

	[lexer.TokenKind.MATCH_WILDCARD_ALL]: ['*'],
	[lexer.TokenKind.MATCH_WILDCARD_ARRAY]: ['[*]'],
	[lexer.TokenKind.MATCH_WILDCARD_OBJECT]: ['{*}'],

	[lexer.TokenKind.PRIMITIVE_KIND_WILDCARD]: ['#*'],
	[lexer.TokenKind.PRIMITIVE_KIND_STRING]: ['#string'],
	[lexer.TokenKind.PRIMITIVE_KIND_NUMBER]: ['#number'],
	[lexer.TokenKind.PRIMITIVE_KIND_BOOLEAN]: ['#boolean'],
	[lexer.TokenKind.PRIMITIVE_NULL]: ['#null'],
	[lexer.TokenKind.PRIMITIVE_TRUE]: ['#true'],
	[lexer.TokenKind.PRIMITIVE_FALSE]: ['#false'],

	[lexer.TokenKind.MATCH_KEY_NAKED]: [
		'a', 'dupa', 'fooBar', 'B', 'BABAxD', 'zzzz', 'Zy', 'Z', 'z', 'A'
	],

	[lexer.TokenKind.PRIMITIVE_NUMBER]: [
		'#0', '#-0', '#-0.0000E+000000', '#-1000', '#1000'
	],

	[lexer.TokenKind.MATCH_INDEX_ALL]: [	
		'123', '0', '3', '9999', '1234567654456787654', '10000000000000',
	],

	[lexer.TokenKind.MATCH_KEY]: [
		`""`, `"dupa"`, `"\\\\\\\n\r"`, `"\\"\\""`, `""`, `""`, `""`,
		`"ᄀᄀᄀ각ᆨᆨ"`,`"ᄀᄀᄀ각ᆨᆨ"`,`"ᄀᄀᄀ각ᆨᆨ   ᄀᄀᄀ각ᆨᆨ"`,
		`"𝒳 12345 01 || + 😂+😂"`,`"😂"`,`"𝒳"`,`"🇺🇸"`,`"👍🏿"`,`"\\👍🏿"`,
		`"<span>"`,`"</span>"`,'"``````````"',`"&|?+-~"`,`"<>"`,`"*"`,
	],
	
	// auto-generated from index_all
	[lexer.TokenKind.MATCH_INDEX_ARRAY]: [],
	// auto-generated from index_all
	[lexer.TokenKind.MATCH_INDEX_OBJECT]: [],
	// auto-generated from match-key
	[lexer.TokenKind.PRIMITIVE_STRING]: [],
}

atomCollection[lexer.TokenKind.MATCH_INDEX_ARRAY].push(
	...atomCollection[lexer.TokenKind.MATCH_INDEX_ALL].map((x) => '['+x+']')
);

atomCollection[lexer.TokenKind.MATCH_INDEX_OBJECT].push(
	...atomCollection[lexer.TokenKind.MATCH_INDEX_ALL].map((x) => '{'+x+'}')
);

atomCollection[lexer.TokenKind.PRIMITIVE_STRING].push(
	...atomCollection[lexer.TokenKind.MATCH_KEY].map((x) => '#'+x)
);


export function lexTestAtoms(): boolean {
	for (const [kind, atomStrings] of Object.entries(atomCollection)){
		for (const atom of atomStrings){
			const tape: lexer.TokenTape = lexer.tokenizeMatchString(atom);
			
			// no atom can return an invalid tape
			if (! lexer.tapeUtils.debug.integrityCheckFull(tape, atom)){
				return false;
			}
			// atoms by definition have to always tokenize into one token
			if (tape.tokenCount != 1){
				return false;
			}
			
			//check if atom tokenized into proper token kind.
			if (tape.tokenKind[0] != Number(kind)) {
				return false;
			}
		}
	} 
	return true;
}

