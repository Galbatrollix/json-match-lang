export { enumUtils, TokenKind } from "./lexer_enum.ts";
export { type TokenTape, tokenizeMatchString } from "./lexer_tape.ts";
import * as debug_ from "./lexer_debug.ts";
import { utils } from "./lexer_tape.ts";
export declare namespace tapeUtils {
    const debug: typeof debug_;
    const display: typeof utils.display;
    const misc: typeof utils.misc;
}
//# sourceMappingURL=lexer_main.d.ts.map