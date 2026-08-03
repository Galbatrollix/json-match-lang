export { enumUtils, TokenKind } from "./lexer_enum.js";
export { tokenizeMatchString } from "./lexer_tape.js";
import * as debug_ from "./lexer_debug.js";
import { utils } from "./lexer_tape.js";
export var tapeUtils;
(function (tapeUtils) {
    tapeUtils.debug = debug_;
    tapeUtils.display = utils.display;
    tapeUtils.misc = utils.misc;
})(tapeUtils || (tapeUtils = {}));
