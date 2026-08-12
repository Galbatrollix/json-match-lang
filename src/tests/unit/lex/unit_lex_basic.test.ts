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
	const output: lexer.TokenTape = lexer.tokenizeExpressionString(empty);
	
	const integrityOk: boolean = lexer.tapeUtils.debug.integrityCheckFull(output, empty);
	if (!integrityOk){
		return false;
	}
	
	if (output.tokenCount != 0){
		return false;
	}

	return true;	
}


/**
	Record of example atoms (inputs that produce a single token)
	for each type of token.
*/
const atomCollection: Record<lexer.TokenKind, Array<string> > = {
	[lexer.TokenKind.ERROR]: [",,,", "...", "\\//"],
	// auto-generated from KEY_QUOTED
	[lexer.TokenKind.ERROR_INCOMPLETE_KEY]: [],
	[lexer.TokenKind.ERROR_INCOMPLETE_VALUE]: ['#tr', "#s", "#", "#3.14e", "#{", "#["],

	// auto-extended from INDEX_OBJECT
	[lexer.TokenKind.ERROR_INCOMPLETE_OBJECT]: ["{", "{*"],
	// auto-extended from INDEX_ARRAY
	[lexer.TokenKind.ERROR_INCOMPLETE_ARRAY]: ["[", "[*"],
	
	[lexer.TokenKind.WHITESPACE]: [' ', '  ', "\n\r\t", "       ", "\t\t\t"],

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

	[lexer.TokenKind.PARENTHESIS_LEFT]: ['('],
	[lexer.TokenKind.PARENTHESIS_RIGHT]: [')'],

	[lexer.TokenKind.WILDCARD_ALL]: ['*'],
	[lexer.TokenKind.WILDCARD_ARRAY]: ['[*]'],
	[lexer.TokenKind.WILDCARD_OBJECT]: ['{*}'],

	[lexer.TokenKind.VALUE_TYPE_WILDCARD]: ['#*'],
	[lexer.TokenKind.VALUE_TYPE_ARRAY]: ['#[]'],
	[lexer.TokenKind.VALUE_TYPE_OBJECT]: ['#{}'],
	[lexer.TokenKind.VALUE_TYPE_STRING]: ['#string'],
	[lexer.TokenKind.VALUE_TYPE_NUMBER]: ['#number'],
	[lexer.TokenKind.VALUE_TYPE_BOOLEAN]: ['#boolean'],
	[lexer.TokenKind.VALUE_EXACT_NULL]: ['#null'],
	[lexer.TokenKind.VALUE_EXACT_TRUE]: ['#true'],
	[lexer.TokenKind.VALUE_EXACT_FALSE]: ['#false'],

	[lexer.TokenKind.KEY_NAKED]: [
		'a', 'dupa', 'fooBar', 'B', 'BABAxD', 'zzzz', 'Zy', 'Z', 'z', 'A'
	],

	[lexer.TokenKind.VALUE_EXACT_NUMBER]: [
		'#0', '#-0', '#-0.0000E+000000', '#-1000', '#1000', '#10000000000000001.1'
	],

	[lexer.TokenKind.INDEX_ALL]: [	
		'123', '0', '3', '9999', '1234567654456787654', '10000000000000',
	],

	[lexer.TokenKind.KEY_QUOTED]: [
		`""`, `"dupa"`, `"\\\\\\\n\r"`, `"\\"\\""`, `"ż"`, `"ąęłó"`, `"h"`,
		`"ᄀᄀᄀ각ᆨᆨ"`,`"ᄀᄀᄀ각ᆨᆨ"`,`"ᄀᄀᄀ각ᆨᆨ   ᄀᄀᄀ각ᆨᆨ"`,
		`"𝒳 12345 01 || + 😂+😂"`,`"😂"`,`"𝒳"`,`"🇺🇸"`,`"👍🏿"`,`"\\👍🏿"`,
		`"<span>"`,`"</span>"`,'"``````````"',`"&|?+-~"`,`"<>"`,`"*"`,
		`"duuuuuu\\"pa"`,`"d"`
	],
	
	// auto-generated from INDEX_ALL
	[lexer.TokenKind.INDEX_ARRAY]: [],
	// auto-generated from INDEX_ALL
	[lexer.TokenKind.INDEX_OBJECT]: [],
	// auto-generated from KEY_QUOTED
	[lexer.TokenKind.VALUE_EXACT_STRING]: [],
};

/*
	Block of auto-generation and auto-extension of atom collections.
*/

// forming index array matches by wrapping generic index match with []
atomCollection[lexer.TokenKind.INDEX_ARRAY].push(
	...atomCollection[lexer.TokenKind.INDEX_ALL].map((x) => '['+x+']')
);

// forming index object matches by wrapping generic index match with {}
atomCollection[lexer.TokenKind.INDEX_OBJECT].push(
	...atomCollection[lexer.TokenKind.INDEX_ALL].map((x) => '{'+x+'}')
);

// forming string primitives by prepending # to well formed keys
atomCollection[lexer.TokenKind.VALUE_EXACT_STRING].push(
	...atomCollection[lexer.TokenKind.KEY_QUOTED].map((x) => '#'+x)
);

// forming incomplete keys by stripping last " char from well formed keys
atomCollection[lexer.TokenKind.ERROR_INCOMPLETE_KEY].push(
	...atomCollection[lexer.TokenKind.KEY_QUOTED].map((x) => x.slice(0, x.length - 1))
);

// forming incomplete object matches by stripping last } char from well formed 
// index object matches
atomCollection[lexer.TokenKind.ERROR_INCOMPLETE_OBJECT].push(
	...atomCollection[lexer.TokenKind.INDEX_OBJECT].map((x) => x.slice(0, x.length - 1))
);

// forming incomplete array matches by stripping last } char from well formed 
// index array matches
atomCollection[lexer.TokenKind.ERROR_INCOMPLETE_ARRAY].push(
	...atomCollection[lexer.TokenKind.INDEX_ARRAY].map((x) => x.slice(0, x.length - 1))
);


/**
	Ensures each atom string produces a tape that has length 1
	and a correct tokenKind value.
*/
export function lexTestAtoms(): boolean {
	for (const [kind, atomStrings] of Object.entries(atomCollection)){
		for (const atom of atomStrings){
			const tape: lexer.TokenTape = lexer.tokenizeExpressionString(atom);
			
			// no atom can return an invalid tape
			if (! lexer.tapeUtils.debug.integrityCheckFull(tape, atom)){
				return false;
			}
			// atoms by definition have to always tokenize into one token
			if (tape.tokenCount != 1){
				return false;
			}
			
			//check if atom tokenized into a proper token kind.
			if (tape.tokenKind[0] != Number(kind)) {
				return false;
			}
		}
	} 
	return true;
}

/** 
	these atoms can be joined with other atoms 
	the same kind if there is nothing inbetween
*/
const joinableAtoms: Array<lexer.TokenKind> = [
	lexer.TokenKind.WHITESPACE,
	lexer.TokenKind.KEY_NAKED,
] as const;

/**
	Makes sure that sequences of the same kind of joinable atom will 
	be combined into a single token. 
*/
export function lexTestJoinableAtoms(): boolean {
	for (const kind of joinableAtoms){
		const str: string = atomCollection[kind].join("");
		
		const tape: lexer.TokenTape = lexer.tokenizeExpressionString(str);
	
		if (! lexer.tapeUtils.debug.integrityCheckFull(tape, str)){
			return false;
		}
	
		if (tape.tokenCount != 1){
			return false;
		}

		if (tape.tokenKind[0] != kind){
			return false;
		}
	}

	return true;
}
/**
	Checks if sequence of alternating different kinds of joinable atoms
	will not combine with each other.
*/
export function lexTestJoinableInterleave(): boolean {
	const interleave = function (arr1: string[], arr2: string[]): string[]{
		const length = Math.min(arr1.length, arr2.length);
		const result: string[] = []
		for(let i=0; i<length; i++){
			result.push(arr1[i], arr2[i]);
		}
		return result;
	}
	const allNaked: Array<string> = atomCollection[lexer.TokenKind.KEY_NAKED];
	const allWhitespace : Array<string> = atomCollection[lexer.TokenKind.WHITESPACE];
	const alternating: Array<string> = interleave(allNaked, allWhitespace);

	const alternatingStr = alternating.join("");
	const tape: lexer.TokenTape = lexer.tokenizeExpressionString(alternatingStr);
	
	if (! lexer.tapeUtils.debug.integrityCheckFull(tape, alternatingStr)){
		return false;
	}
	if (tape.tokenCount != alternating.length){
		return false;
	}		

	return true;
}


/**
	These atoms must remain separate from others no matter what.
*/
const disjointAtoms: Array<lexer.TokenKind> = [
	lexer.TokenKind.OPERATOR_CHILD,
	lexer.TokenKind.OPERATOR_PARENT,
	lexer.TokenKind.OPERATOR_SIBLING_NEXT,
	lexer.TokenKind.OPERATOR_SIBLING_PREV,
	lexer.TokenKind.OPERATOR_SIBLING_ANY,
	lexer.TokenKind.OPERATOR_OR,
	lexer.TokenKind.OPERATOR_AND,
	lexer.TokenKind.OPERATOR_NOT,
	lexer.TokenKind.PARENTHESIS_LEFT,
	lexer.TokenKind.PARENTHESIS_RIGHT,
	lexer.TokenKind.KEY_QUOTED,
	lexer.TokenKind.INDEX_ARRAY,
	lexer.TokenKind.INDEX_OBJECT,
	lexer.TokenKind.WILDCARD_ALL,
	lexer.TokenKind.WILDCARD_ARRAY,
	lexer.TokenKind.WILDCARD_OBJECT,
	lexer.TokenKind.VALUE_TYPE_WILDCARD,
	lexer.TokenKind.VALUE_TYPE_STRING,
	lexer.TokenKind.VALUE_TYPE_NUMBER,
	lexer.TokenKind.VALUE_TYPE_BOOLEAN,
	lexer.TokenKind.VALUE_EXACT_NULL,
	lexer.TokenKind.VALUE_EXACT_TRUE,
	lexer.TokenKind.VALUE_EXACT_FALSE,
	lexer.TokenKind.VALUE_EXACT_NUMBER,
	lexer.TokenKind.VALUE_EXACT_STRING,
];

/**
	Tests if all disjoint atoms parse as separate tokens
	even if glued into a single input string.
*/
export function lexTestDisjointAtoms(): boolean {
	for (const atomKind of disjointAtoms){
		const str: string = atomCollection[atomKind].join("");
		const atomCount = atomCollection[atomKind].length;
		
		const tape: lexer.TokenTape = lexer.tokenizeExpressionString(str);
	
		if (! lexer.tapeUtils.debug.integrityCheckFull(tape, str)){
			return false;
		}
		
		// tape must be the same length as the count of atoms 
		if (tape.tokenCount != atomCount){
			return false;
		}
		
		// exnure all token kinds in resulting tape are proper
		for (const tapeKind of tape.tokenKind){
			if (tapeKind != atomKind){
				return false;
			}
		}
	}
	return true;
}


/**
	Ensures that two non-whitespace and non-error 
	atoms separated by whitespace parse properly.
*/
export function lextTestWhitespaceBetweenAtoms(): boolean {
	// pararell arrays
	const nonWhitespaceAtoms: Array<string> = [];
	const nonWhitespaceKinds: Array<lexer.TokenKind> = [];

	for (const [kind, atomStrings] of Object.entries(atomCollection)){
		// filtering out whitespace
		if (Number(kind) == lexer.TokenKind.WHITESPACE){
			continue;
		}
		// filtering out errors
		if (lexer.TokenKindUtils.isError(Number(kind))){
			continue;
		}
		
		for (const atom of atomStrings){
			nonWhitespaceAtoms.push(atom);
			nonWhitespaceKinds.push(Number(kind));
		}
	}
	// creating array of whitespace atoms interleaved with other atoms
	const interleavedWithWhitespace: Array<string> = [];
	for (let i = 0; i < nonWhitespaceAtoms.length; i++){
		const whitespaceId = i % atomCollection[lexer.TokenKind.WHITESPACE].length;
		interleavedWithWhitespace.push(
			atomCollection[lexer.TokenKind.WHITESPACE][whitespaceId]
		);
		interleavedWithWhitespace.push(nonWhitespaceAtoms[i]);
	}
	
	const combined = interleavedWithWhitespace.join("");
	
	const tape: lexer.TokenTape = lexer.tokenizeExpressionString(combined);
	if (! lexer.tapeUtils.debug.integrityCheckFull(tape, combined)){
		return false;
	}	
	
	// verify whether tape is well formed in regards to atoms and whitespaces
	if (tape.tokenCount != interleavedWithWhitespace.length){
		return false;
	}
	for (let i = 0; i < tape.tokenCount; i++){
		const expectWhitespace: boolean = i % 2 == 0;

		if (expectWhitespace){
			if (tape.tokenKind[i] != lexer.TokenKind.WHITESPACE){
				return false;
			}
		}else{
			const idx = Math.floor(i/2);
			if (tape.tokenKind[i] != nonWhitespaceKinds[idx]){
				return false;
			}
			if (tape.tokenString[i] != nonWhitespaceAtoms[idx]){
				return false;
			}
		}	
	}
	
	return true;
}

/**
	Checks if siblings utilizing identical characters parse in correct order.
	When ambiguity arises, variant with 2 characters should take precedence over
	variant with 1 character.
*/
export function lexTestSiblingOperatorPrecedence(): boolean {
	const next = '+++';
	const prev = '---';
	const nextTape = lexer.tokenizeExpressionString(next);
	const prevTape = lexer.tokenizeExpressionString(prev);
	
	const nValid = lexer.tapeUtils.debug.integrityCheckFull(nextTape, next);
	const pValid = lexer.tapeUtils.debug.integrityCheckFull(prevTape, prev);

	if (!nValid || !pValid){
		return false;
	}	
		
	if (nextTape.tokenCount != 2 || prevTape.tokenCount != 2){
		return false;
	}

	if ( nextTape.tokenKind[0] != lexer.TokenKind.OPERATOR_SIBLING_SUBSEQUENT
		|| nextTape.tokenKind[1] != lexer.TokenKind.OPERATOR_SIBLING_NEXT){
		return false;
	}

	if ( prevTape.tokenKind[0] != lexer.TokenKind.OPERATOR_SIBLING_PRECEDING
		|| prevTape.tokenKind[1] != lexer.TokenKind.OPERATOR_SIBLING_PREV){
		return false;
	}

	return true;
}