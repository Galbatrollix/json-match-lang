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
exports.parseConstraintsTopLevel = parseConstraintsTopLevel;
const parser_types_ts_1 = require("./parser_types.js");
const lexer = __importStar(require("./../lex/lexer_main.js"));
/**
    Top level function that will be called by the main
    parser once a constraint block must be handled.
    
    If parse succeded, returns: {ConstraintTreeNode, consumedTokens}
    If parse failed, returns: undefined
    
*/
function parseConstraintsTopLevel(tokens, start) {
    const dummyTreeNode = [];
    // todo report consumed characters on fail for error purposes
    const [consumed, success] = parseOrBlock(tokens, start, dummyTreeNode);
    return {
        constraint: dummyTreeNode[0],
        consumed: consumed,
        success: success,
    };
}
/**
    Parses a single token atom constraint
*/
function parseAtom(tokens, start, outputTree) {
    if (start == tokens.length) {
        return [0, false];
    }
    const tokenOk = lexer.TokenKindUtils.isConstraint(tokens[start]);
    if (!tokenOk) {
        return [0, false];
    }
    // success, emitting AST node
    const newNode = {
        kind: parser_types_ts_1.ConstraintTreeNodeKind.ATOM,
        range: [start, start + 1],
        children: [],
    };
    outputTree.push(newNode);
    return [1, true];
}
const parseTerm = combinatorOr([parseNegation, parseAtom, parseParenthesizedBlock]);
/**
    Assembles parse logic for paretnehsized-block parse function
    but doesnt handle the output tree transforms,
    that is left for the main function.
*/
const parseParenthesizedBlockInternal = combinatorChain([
    createSingleTokenParse(lexer.TokenKind.PARENTHESIS_LEFT),
    parseOrBlock,
    createSingleTokenParse(lexer.TokenKind.PARENTHESIS_RIGHT),
]);
function parseParenthesizedBlock(tokens, start, outputTree) {
    const childTree = [];
    const [consumed, matched] = parseParenthesizedBlockInternal(tokens, start, childTree);
    if (!matched) {
        return [consumed, false];
    }
    // inner function matched, construct output
    const newNode = {
        kind: parser_types_ts_1.ConstraintTreeNodeKind.PARENS,
        range: [start, start + consumed],
        children: childTree,
    };
    outputTree.push(newNode);
    return [consumed, true];
}
const parseAndOperator = createSingleTokenParse(lexer.TokenKind.OPERATOR_AND);
/**
    Assembles parse logic for and-block parse function
    but doesnt handle the output tree transforms,
    that is left for the main function.
*/
const parseAndBlockInternal = combinatorChain([
    parseTerm,
    combinatorOptionalRepeat(combinatorChain([parseAndOperator, parseTerm])),
]);
function parseAndBlock(tokens, start, outputTree) {
    const childTree = [];
    const [consumed, matched] = parseAndBlockInternal(tokens, start, childTree);
    if (!matched) {
        return [consumed, false];
    }
    // inner function matched, construct output
    const newNode = {
        kind: parser_types_ts_1.ConstraintTreeNodeKind.AND,
        range: [start, start + consumed],
        children: childTree,
    };
    outputTree.push(newNode);
    return [consumed, true];
}
const parseOrOperator = createSingleTokenParse(lexer.TokenKind.OPERATOR_OR);
/**
    Assembles parse logic for or-block parse function
    but doesnt handle the output tree transforms,
    that is left for the main function.
*/
const parseOrBlockInternal = combinatorChain([
    parseAndBlock,
    combinatorOptionalRepeat(combinatorChain([parseOrOperator, parseAndBlock])),
]);
function parseOrBlock(tokens, start, outputTree) {
    const childTree = [];
    const [consumed, matched] = parseOrBlockInternal(tokens, start, childTree);
    if (!matched) {
        return [consumed, false];
    }
    // inner function matched, construct output
    const newNode = {
        kind: parser_types_ts_1.ConstraintTreeNodeKind.OR,
        range: [start, start + consumed],
        children: childTree,
    };
    outputTree.push(newNode);
    return [consumed, true];
}
const parseNegationImpl = combinatorOr([parseNegation, parseAtom, parseParenthesizedBlock]);
function parseNegation(tokens, start, outputTree) {
    if (start == tokens.length) {
        return [0, false];
    }
    const notTokenPresent = tokens[start] == lexer.TokenKind.OPERATOR_NOT;
    if (!notTokenPresent) {
        return [0, false];
    }
    const childTree = [];
    const [consumed, matched] = parseNegationImpl(tokens, start + 1, childTree);
    // output tree needs not be rolled back on fail since only 1 function was called
    // and each parse function must not modify output tree on fail.
    if (!matched) {
        return [consumed + 1, false];
    }
    // inner function matched, construct output
    const newNode = {
        kind: parser_types_ts_1.ConstraintTreeNodeKind.NOT,
        range: [start, start + consumed + 1],
        children: childTree,
    };
    outputTree.push(newNode);
    return [consumed + 1, true];
}
/*

    Below live generic parser combinators and generator functions
    - building blocks for actual parsers above.

*/
/*
    Parser combinator that tranforms an array of parse functions into a single parse
    function that matches if at least one of the given functions matches.

    If multiple functions match, then:
    resulting parse function will match the one encountered first
    and emit to outputTree only that function's logic.

*/
function combinatorOr(funcList) {
    const resultFunc = function (tokens, start, outputTree) {
        let maxConsumed = 0;
        for (const fn of funcList) {
            const [consumed, matched] = fn(tokens, start, outputTree);
            if (matched) {
                return [consumed, true];
            }
            maxConsumed = maxConsumed > consumed ? maxConsumed : consumed;
        }
        // ran out of functions
        return [maxConsumed, false];
    };
    return resultFunc;
}
/*
    Parser combinator that tranforms an array of parse functions into a single parse
    function that matches if all provided functions match in provided order
    one, after another.

    Function may modify outputTree array, but if it fails, changes (if any)
    are guaranteed to rollback to original state.
*/
function combinatorChain(funcList) {
    // alias for length reassign operation so its obvious what it is
    function rollbackTree(outputTree, initialLength) {
        outputTree.length = initialLength;
    }
    const resultFunc = function (tokens, start, outputTree) {
        const initialTreeLength = outputTree.length;
        let at = start;
        for (let fnIndex = 0; fnIndex < funcList.length; fnIndex++) {
            const [consumed, matched] = funcList[fnIndex](tokens, at, outputTree);
            if (!matched) {
                rollbackTree(outputTree, initialTreeLength);
                return [at - start + consumed, false];
            }
            at += consumed;
        }
        // all functions passed
        const consumedTotal = at - start;
        return [consumedTotal, true];
    };
    return resultFunc;
}
/**
    Parser combinator that tranforms a single parse function into a new
    function that attempts to repeatedly match function provided as parameter
    until it fails.

    In other words, matches a n-lengthed chain of given functions (n >= 0)
    always matches longest possible sequence,

    Since empty sequence is a 0-length match,
    resulted function is incapable of failing.

*/
function combinatorOptionalRepeat(func) {
    const resultFunc = function (tokens, start, outputTree) {
        let matched = false;
        let consumedTotal = 0;
        for (;;) {
            const result = func(tokens, start + consumedTotal, outputTree);
            matched = result[1];
            if (!matched) {
                break;
            }
            consumedTotal += result[0];
        }
        return [consumedTotal, true];
    };
    return resultFunc;
}
/**
    Parser generator that creates a parse function
    that consumes exactly 1 specific token on success
    or does nothing on failure. Never modifies AST.
*/
function createSingleTokenParse(token) {
    const resultFunc = function (tokens, start, outputTree) {
        //@ts-ignore
        const _unused = outputTree;
        if (start == tokens.length) {
            return [0, false];
        }
        const matched = tokens[start] == token;
        if (matched) {
            return [1, true];
        }
        else {
            return [0, false];
        }
    };
    return resultFunc;
}
