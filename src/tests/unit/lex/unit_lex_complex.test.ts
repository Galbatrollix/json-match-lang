/**
	All functions in this file should be ()=> boolean
	They are automatically reexported via unit_lex_all.test.ts file
*/

import {lexer} from "../../../main.ts"

/**
	Crazy strings are broadly speaking invalid unicode strings
	or ones containing very special characters like 0 and such
	read below links for more info
	https://news.ycombinator.com/item?id=10035008
	https://github.com/minimaxir/big-list-of-naughty-strings

*/
const crazyStrings: Array<string> = [
	`x` +`😂😂`.slice(1,3) + `y`,                  // surrogate pair pieces
	`\u0000`, `du\u0000pa`,`u\u0000`,             // NULL 
	`\uFDD0`, `1\uFDD0234`, `ed\uFDD0`,          // not a character
	`\uFEFFXXX`, `a\uFEFFX`, `\uFEFF\uFEFF`,    // BOM or some shit
	`\u0085`, `ddd\u0085s`, `\u0085\u0085`,    // next line (?)
	`\u2028`, `b\u2028asd`, `\u2028xd`, 
	`\u2029`, `z\u2029a`, `\u2029mn`,
	`\uDBC0\uDC00`, 
	`\u200B`, ` \u200B `, `\u200Bxddad`,   // 0 width space

	// strings with vicious characters taken from big list
	`🇺🇸🇷🇺🇸 🇦🇫🇦🇲🇸`, `test⁠test‫`,
	`᚛ᚄᚓᚐᚋᚒᚄ ᚑᚄᚂᚑᚏᚅ᚜‪‪‪`,
	`‪‪᚛                 ᚜‪`,
	`test‪`, 
	`‫test`,
	`test `,
	`⁦test⁧`,
	`The quic\b\b\b\b\b\bk brown fo\u0007\u0007\u0007\u0007\u0007\u0007\u0007\u0007\u0007\u0007\u0007x... [Beeeep]`,
	`But now...\u001b[20Cfor my greatest trick...\u001b[8m`,
	`Roses are \u001b[0;31mred\u001b[0m, violets are \u001b[0;34mblue. Hope you enjoy terminal hue`,
	
	// CUrsed text piece below
	`Z̷̢̢̢̧̨̨̢̧̡̡̢̡̧̡̡̛̛̘͚̬̣̬̭̟͕͇̞̫̺̙͓͇͕̖̩̥̫̖̪̗̗͖̣̫͔͕͓̞̼͚͙̬͎͕̣̤̻̘͎̗̰̝̳̘̯̻̗̺̭̮̼̫̮̼̖̤̰̩̯͈͚̖̜̟̹͖̮̼̱̥̫̺̳͙̹̦̬̥͇͚̻̬̻͈̻̳̪̝̱̥̰͕̻͈̳͇͚̟͓̮̼͚̟̳͇̹̮̦̟͎̘̜̩͔̝̜̮̪̠̯̩͈̭̱̬̗͇̳̬̗͖͇̫̙̮͇̰̲̲̖̲͈͇̥̗͇͓̣̻͙͎̻̘͖̭̣̩̰̘͖̦̲̞̱͇͇̝̹͓̗̞̭̮͚̬͈̤̝̝̣̗͔͖̞͚̥͔͚̥̲̼̞͕̞̳̟̖̯̒̌͑͆̿̌̊̈́̊̈͌͑͋͒͒͂̍̓̇̐͒̀̋̀͂̒͂̈́̍̓̓̋̄̅̐͊̓͛̇̕͜͜͜͜͜͜͜͜͝͝͠ͅͅͅͅͅṂ̸̢̢̢̛̛̣͍̘͚̼̞͇̮̻̼̫̪̣͙͔͎̼̫̫͕̥̇̐͌̈́̀͗̓̄̄͛̆͂̈́̓̾́͂̉͆͂̆̑͛̔̀̓͋̉̃͒͂̀͒̀́̄̐̓̽̐̋̿́̅́̾̈́̈́͊͂̀̄̑͐̍͗̐͗̀̾̽͌͂̆͑́̑̓̎͂̾̓̊̈́̄̿̉͐̉͑́̅͌̈́̈́̃̊͒̾̾̄͗̒̐͊̀͑̈́̿͊͐̂̅͋̐̌̎͗͌̌̒̇͆̿͒̋͋̇̾͌̌͒̆͗̑̈́͋̒̿͛͑̃͆͂͌́͋̽͋̏̐̀̈́̎̃̉̇̆͒͆͋̒̊̋̈́̂̋̊͐̃̆̾̅̊̐̀̓͛̒͒̽̓̐͊̇̈̕̕̚͘̕̚̕̚͘̚̚͘̕̕͘͘̚͠͝͝͠͠͝͝͝͝͠͝͝ͅĮ̵̧̡̡̧̢̨̡̧̨̨̨̧̧̡̧̢̡̧̢̢̡̡̛̛̛͕͔͉̟̪͈̤̺̞̰̩̲͔̞͓̙͔̥̰̮̲̻̼̭͙͍͉̹̗͎̦̪̟͕͚̥͕̩̰̬̖̦͕̻̲͔̱̦̘̖̳̩̼̺͖͈̫͓̼̺͔͇̭͓̤͍͍̺̝̺̪̟͚̰̙̦̣̫̣͓̫͚̻̝͙̹̘̮͖̙̮̬͙͉̙͇̩̬̯͙̠̮͉͔̳̥̮̭̼͕̞̻͍̥̤͔̜͔̳͙̫̦͖͖̱̻̺̦̟̦̫̝̥͎̺̞͙̩̙̟͍̗̭̭̦͈͇͚̝̮̺̲͈͔͓̤̯͈͈̟̱̩͎̮̩͚̹̩̣̗̼̮͙͙̼̙̻͕̙̼̯͎̞̫͖̯̝͔̪͇̝̱͙͙͇̦͙̜̬͉̙̹͓̬̫̘̤̪͓̭͉̰̮̤͙̫͈̼̦͎͓̺͓̤̤͈̦̬̣͈͍̹̼͚̜̱̣̟̯͇̥̟̼͎̣̩̱̭̤̳̘͉̮͍̯͆̇̿͛̆͋̈́͑͒͗͑́̏̍͂̊͐͒͌̉͒͋̋̽̽̄͐̅͌̃͋̈́͗͒̅͂͊̾͋̒͑̅̌͑̽̇̑̈̈́̃̊͊̈̆̄̒͑͑̊̇̏͑̉̔̈̐͒̓̂̋̅̈́̄͛̆͋̀̌́͆͐͒̑̈́̎͐̉̇̔̃͛̔͂̿͆́̋̑͆̓́͋̄̆̉͊͐́̂̓̈́̄̆̀̈̐͊̆̉̎̋̀̓̊̿͊̔̈́͌͐̄̓̔̄̓̊̀̃̊̋͒̾̎̇̿͋̀̒͊̑͊̿̂̌̉͊̌͂̽̈́́̔̈̌̓͆̓̓̇͒͊̿̍͗̀̈́͂̄̓̀̌̅̈́̚̚̚̕̕͘̚̕̕̚͘̕̕̕͘͘͘͜͜͜͜͜͜͝͝͝͝͝͝͠͝͝͝͝͠͠͝͠͝ͅͅͅͅͅͅ`,
	`TORIX` + `b̶̨̡͎͈̫̗͚͗̃̾̃̕͝a̸̡̓̎̑̂ķ̷̡͓̩͔͈̍ͅă̴͖̝̘͒̌͐͜͜`+ `EQUALS FUN`,
];

for (let i = 0; i< crazyStrings.length; i++){
	crazyStrings[i] = `"` + crazyStrings[i] + `"`;
}

/**
	Makes sure all crazy strings properly lex into single string tokens.
*/
export function lexTestCrazyStrings(): boolean {
	for (const str of crazyStrings) {
		const tape: lexer.TokenTape = lexer.tokenizeMatchString(str);
		
		if(! lexer.tapeUtils.debug.integrityCheckFull(tape, str)){
			return false;
		}
		// tokens are expected to parse as single strings
		if (tape.tokenCount != 1){
			return false;
		}	
		if (tape.tokenKind[0] != lexer.TokenKind.MATCH_KEY){
			return false;
		}
	}
	return true;
}


type expressionEntry = {
	expr: string,
	tokens: Array<lexer.TokenKind>,
};
const tk = lexer.TokenKind;
/**
	Full json match expressions and their corresponding 
	expected token sequences
*/
const fullExpressions: Array<expressionEntry> = [
	{
		expr: `dupa > kupa`,
		tokens: [
			tk.MATCH_KEY_NAKED, tk.WHITESPACE, tk.OPERATOR_CHILD,
		 	tk.WHITESPACE, tk.MATCH_KEY_NAKED,
		],
	},
	{
		expr: `> "a9re13"&0 > *`,
		tokens: [
			tk.OPERATOR_CHILD, tk.WHITESPACE, tk.MATCH_KEY,
		 	tk.OPERATOR_AND, tk.MATCH_INDEX_ALL, tk.WHITESPACE,
			tk.OPERATOR_CHILD, tk.WHITESPACE, tk.MATCH_WILDCARD_ALL,
		],
	},
	{
		expr: `* > styles <`,
		tokens: [
			tk.MATCH_WILDCARD_ALL, tk.WHITESPACE, tk.OPERATOR_CHILD,
			tk.WHITESPACE, tk.MATCH_KEY_NAKED, tk.WHITESPACE, 
			tk.OPERATOR_PARENT, 
		],
	},
	{
		expr: `|||||||||||||||||||`,
		tokens: [tk.OPERATOR_OR, tk.OPERATOR_OR, tk.OPERATOR_OR, tk.OPERATOR_OR, tk.OPERATOR_OR, tk.OPERATOR_OR, tk.OPERATOR_OR, tk.OPERATOR_OR, tk.OPERATOR_OR, tk.OPERATOR_OR, tk.OPERATOR_OR, tk.OPERATOR_OR, tk.OPERATOR_OR, tk.OPERATOR_OR, tk.OPERATOR_OR, tk.OPERATOR_OR, tk.OPERATOR_OR, tk.OPERATOR_OR, tk.OPERATOR_OR, ],
	},
	{
		expr: `+++++++++++++++`,
		tokens: [tk.OPERATOR_SIBLING_SUBSEQUENT, tk.OPERATOR_SIBLING_SUBSEQUENT, tk.OPERATOR_SIBLING_SUBSEQUENT, tk.OPERATOR_SIBLING_SUBSEQUENT, tk.OPERATOR_SIBLING_SUBSEQUENT, tk.OPERATOR_SIBLING_SUBSEQUENT, tk.OPERATOR_SIBLING_SUBSEQUENT, tk.OPERATOR_SIBLING_NEXT, ],
	},

	{
		expr: `<<>><<#-3.124E55~XD`,
		tokens: [tk.OPERATOR_PARENT, tk.OPERATOR_PARENT, tk.OPERATOR_CHILD, tk.OPERATOR_CHILD, tk.OPERATOR_PARENT, tk.OPERATOR_PARENT, tk.PRIMITIVE_NUMBER, tk.OPERATOR_SIBLING_ANY, tk.MATCH_KEY_NAKED, ],
	},

	{
		expr: `{*} >> dupa | DUPA  ~ kupa | KUPA`,
		tokens: [tk.MATCH_WILDCARD_OBJECT, tk.WHITESPACE, tk.OPERATOR_CHILD, tk.OPERATOR_CHILD, tk.WHITESPACE, tk.MATCH_KEY_NAKED, tk.WHITESPACE, tk.OPERATOR_OR, tk.WHITESPACE, tk.MATCH_KEY_NAKED, tk.WHITESPACE, tk.OPERATOR_SIBLING_ANY, tk.WHITESPACE, tk.MATCH_KEY_NAKED, tk.WHITESPACE, tk.OPERATOR_OR, tk.WHITESPACE, tk.MATCH_KEY_NAKED, ],
	},
	{
		expr: `0|1|2|3|4 > #true`,
		tokens: [tk.MATCH_INDEX_ALL, tk.OPERATOR_OR, tk.MATCH_INDEX_ALL, tk.OPERATOR_OR, tk.MATCH_INDEX_ALL, tk.OPERATOR_OR, tk.MATCH_INDEX_ALL, tk.OPERATOR_OR, tk.MATCH_INDEX_ALL, tk.WHITESPACE, tk.OPERATOR_CHILD, tk.WHITESPACE, tk.PRIMITIVE_TRUE, ],
	},
	{
		expr: `"one""two""three""four"-five`,
		tokens: [tk.MATCH_KEY, tk.MATCH_KEY, tk.MATCH_KEY, tk.MATCH_KEY, tk.OPERATOR_SIBLING_PREV, tk.MATCH_KEY_NAKED, ],
	},
	{
		expr: `"one"two"three"four-five`,
		tokens: [tk.MATCH_KEY, tk.MATCH_KEY_NAKED, tk.MATCH_KEY, tk.MATCH_KEY_NAKED, tk.OPERATOR_SIBLING_PREV, tk.MATCH_KEY_NAKED, ],
	},
	{
		expr: String.raw`\\\\\\\\\\\\dddad\\d+{{errormuch?}}`,
		tokens: [tk.ERROR, tk.OPERATOR_SIBLING_NEXT, tk.ERROR, ],
	},
	{
		expr: `> THIS >> "is" > "a" > Pretty | Long > "expression" > string <<<> Long > is > a > good > way > to > say > that`,
		tokens: [tk.OPERATOR_CHILD, tk.WHITESPACE, tk.MATCH_KEY_NAKED, tk.WHITESPACE, tk.OPERATOR_CHILD, tk.OPERATOR_CHILD, tk.WHITESPACE, tk.MATCH_KEY, tk.WHITESPACE, tk.OPERATOR_CHILD, tk.WHITESPACE, tk.MATCH_KEY, tk.WHITESPACE, tk.OPERATOR_CHILD, tk.WHITESPACE, tk.MATCH_KEY_NAKED, tk.WHITESPACE, tk.OPERATOR_OR, tk.WHITESPACE, tk.MATCH_KEY_NAKED, tk.WHITESPACE, tk.OPERATOR_CHILD, tk.WHITESPACE, tk.MATCH_KEY, tk.WHITESPACE, tk.OPERATOR_CHILD, tk.WHITESPACE, tk.MATCH_KEY_NAKED, tk.WHITESPACE, tk.OPERATOR_PARENT, tk.OPERATOR_PARENT, tk.OPERATOR_PARENT, tk.OPERATOR_CHILD, tk.WHITESPACE, tk.MATCH_KEY_NAKED, tk.WHITESPACE, tk.OPERATOR_CHILD, tk.WHITESPACE, tk.MATCH_KEY_NAKED, tk.WHITESPACE, tk.OPERATOR_CHILD, tk.WHITESPACE, tk.MATCH_KEY_NAKED, tk.WHITESPACE, tk.OPERATOR_CHILD, tk.WHITESPACE, tk.MATCH_KEY_NAKED, tk.WHITESPACE, tk.OPERATOR_CHILD, tk.WHITESPACE, tk.MATCH_KEY_NAKED, tk.WHITESPACE, tk.OPERATOR_CHILD, tk.WHITESPACE, tk.MATCH_KEY_NAKED, tk.WHITESPACE, tk.OPERATOR_CHILD, tk.WHITESPACE, tk.MATCH_KEY_NAKED, tk.WHITESPACE, tk.OPERATOR_CHILD, tk.WHITESPACE, tk.MATCH_KEY_NAKED, ],
	},
	{
		expr: `|++&*<+><!!#null+-~!&|`,
		tokens: [tk.OPERATOR_OR, tk.OPERATOR_SIBLING_SUBSEQUENT, tk.OPERATOR_AND, tk.MATCH_WILDCARD_ALL, tk.OPERATOR_PARENT, tk.OPERATOR_SIBLING_NEXT, tk.OPERATOR_CHILD, tk.OPERATOR_PARENT, tk.OPERATOR_NOT, tk.OPERATOR_NOT, tk.PRIMITIVE_NULL, tk.OPERATOR_SIBLING_NEXT, tk.OPERATOR_SIBLING_PREV, tk.OPERATOR_SIBLING_ANY, tk.OPERATOR_NOT, tk.OPERATOR_AND, tk.OPERATOR_OR, ],
	},
	{
		expr: ``,
		tokens: [],
	},
	{
		expr: ``,
		tokens: [],
	},

];

/**
	Tests integrity of results from fullExpressions
	collection and whether produced token kinds match
	the expectation.
*/
export function lexTestFullExpressions(): boolean {
	for (const {expr, tokens} of fullExpressions ){
		const tape: lexer.TokenTape = lexer.tokenizeMatchString(expr);
		const valid: boolean = lexer.tapeUtils.debug.integrityCheckFull(tape, expr);
		if (! valid ){
			return false;
		}

		const kindsOk: boolean = tokenKindsEqual(tape.tokenKind, tokens);
		if (! kindsOk){
			return false;
		}
	}
	return true;
}

/** returns true if two tokenKind arrays are identical, otherwise false*/
function tokenKindsEqual(
	fromTape: Readonly<Array<lexer.TokenKind>>,
    expected: Array<lexer.TokenKind>,
): boolean {
	if (fromTape.length != expected.length){
		return false;	
	}
	
	for (let i = 0; i < fromTape.length; i++){
		if(fromTape[i] != expected[i]){
			return false;
		}
	}

	return true;
}