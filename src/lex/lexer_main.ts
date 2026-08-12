export {TokenKindUtils, TokenKind} from "./lexer_enum.ts"
export {type TokenTape, tokenizeExpressionString} from "./lexer_tape.ts"


import  * as debug_ from "./lexer_debug.ts"
import {utils} from "./lexer_tape.ts"

export namespace tapeUtils {
	export const debug = debug_;
	export const display = utils.display;
	export const misc = utils.misc;
}

