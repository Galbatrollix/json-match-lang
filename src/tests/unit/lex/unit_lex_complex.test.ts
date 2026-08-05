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