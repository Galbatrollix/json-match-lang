"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.tapeUtils = exports.tokenizeMatchString = exports.TokenKind = exports.enumUtils = void 0;
var lexer_enum_ts_1 = require("./lexer_enum.js");
Object.defineProperty(exports, "enumUtils", { enumerable: true, get: function () { return lexer_enum_ts_1.enumUtils; } });
Object.defineProperty(exports, "TokenKind", { enumerable: true, get: function () { return lexer_enum_ts_1.TokenKind; } });
var lexer_tape_ts_1 = require("./lexer_tape.js");
Object.defineProperty(exports, "tokenizeMatchString", { enumerable: true, get: function () { return lexer_tape_ts_1.tokenizeMatchString; } });
const debug_ = __importStar(require("./lexer_debug.js"));
const lexer_tape_ts_2 = require("./lexer_tape.js");
var tapeUtils;
(function (tapeUtils) {
    tapeUtils.debug = debug_;
    tapeUtils.display = lexer_tape_ts_2.utils.display;
    tapeUtils.misc = lexer_tape_ts_2.utils.misc;
})(tapeUtils || (exports.tapeUtils = tapeUtils = {}));
