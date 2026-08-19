import { treeifyObject } from "./../vendored/treeify.js";
import * as lexer from "./../lex/lexer_main.js";
/**
    Enum representing all possible combinators (aka relations between
    adjacent contraint blocks in the json match lang expression)
*/
export var ExpressionCombinator;
(function (ExpressionCombinator) {
    ExpressionCombinator[ExpressionCombinator["DESCENDANT"] = 0] = "DESCENDANT";
    ExpressionCombinator[ExpressionCombinator["CHILD"] = 1] = "CHILD";
    ExpressionCombinator[ExpressionCombinator["PARENT"] = 2] = "PARENT";
    ExpressionCombinator[ExpressionCombinator["SIBLING_NEXT"] = 3] = "SIBLING_NEXT";
    ExpressionCombinator[ExpressionCombinator["SIBLING_PREV"] = 4] = "SIBLING_PREV";
    ExpressionCombinator[ExpressionCombinator["SIBLING_SUBSEQUENT"] = 5] = "SIBLING_SUBSEQUENT";
    ExpressionCombinator[ExpressionCombinator["SIBLING_PRECEDING"] = 6] = "SIBLING_PRECEDING";
    ExpressionCombinator[ExpressionCombinator["SIBLING_ANY"] = 7] = "SIBLING_ANY";
})(ExpressionCombinator || (ExpressionCombinator = {}));
/**
    Each node in constraint tree must be one one of the following kinds.
*/
export var ConstraintTreeNodeKind;
(function (ConstraintTreeNodeKind) {
    ConstraintTreeNodeKind[ConstraintTreeNodeKind["ATOM"] = 0] = "ATOM";
    ConstraintTreeNodeKind[ConstraintTreeNodeKind["PARENS"] = 1] = "PARENS";
    ConstraintTreeNodeKind[ConstraintTreeNodeKind["NOT"] = 2] = "NOT";
    ConstraintTreeNodeKind[ConstraintTreeNodeKind["AND"] = 3] = "AND";
    ConstraintTreeNodeKind[ConstraintTreeNodeKind["OR"] = 4] = "OR";
    ConstraintTreeNodeKind[ConstraintTreeNodeKind["IMPLICIT"] = 5] = "IMPLICIT";
})(ConstraintTreeNodeKind || (ConstraintTreeNodeKind = {}));
/**
    Contains additional functions for handling expression parse tape values.
*/
export var ExpressionParseTapeUtils;
(function (ExpressionParseTapeUtils) {
    let Display;
    (function (Display) {
        function asTree(parseTape, tokenTape, showAtomKinds) {
            showAtomKinds = !!showAtomKinds;
            const trees = [];
            for (let i = 0; i < parseTape.constraints.length; i++) {
                const combinator = ExpressionCombinator[parseTape.combinators[i]];
                const root = parseTape.constraints[i];
                const obj = ConstraintTreeNodeUtils.Display.treeifyRepr(root, tokenTape, showAtomKinds);
                trees.push(combinator);
                trees.push(treeifyObject(obj, true));
            }
            return trees.join("\n");
        }
        Display.asTree = asTree;
    })(Display = ExpressionParseTapeUtils.Display || (ExpressionParseTapeUtils.Display = {}));
})(ExpressionParseTapeUtils || (ExpressionParseTapeUtils = {}));
export var ConstraintTreeNodeUtils;
(function (ConstraintTreeNodeUtils) {
    let Display;
    (function (Display) {
        function treeifyRepr(node, tokenTape, showAtomKinds) {
            let [rootIdx, rootVal] = treeifyReprImpl(node, tokenTape, showAtomKinds, 0);
            return { [rootIdx]: rootVal };
        }
        Display.treeifyRepr = treeifyRepr;
        function treeifyReprImpl(node, tokenTape, showAtomKinds, childIndex) {
            const kindStr = ConstraintTreeNodeKind[node.kind];
            const indexStr = `(${childIndex})`;
            let atomKindStr = '';
            if (showAtomKinds && node.kind == ConstraintTreeNodeKind.ATOM) {
                atomKindStr = " " + lexer.TokenKind[tokenTape.tokenKind[node.tokenIdx]];
            }
            const identifier = kindStr + atomKindStr + " " + indexStr;
            // atom case 
            if (node.kind == ConstraintTreeNodeKind.ATOM) {
                const token = tokenTape.tokenString[node.tokenIdx];
                return [identifier, token];
            }
            // implicit case
            if (node.kind == ConstraintTreeNodeKind.IMPLICIT) {
                return [identifier, "(implicit) *"];
            }
            // remaining cases that have children
            let children = [];
            if (node.kind == ConstraintTreeNodeKind.NOT) {
                children = [node.child];
            }
            else { // and, or cases
                children = node.children;
            }
            // constructing result from children recursively
            const result = {};
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                const [childId, childObj] = treeifyReprImpl(child, tokenTape, showAtomKinds, i);
                result[childId] = childObj;
            }
            return [identifier, result];
        }
    })(Display = ConstraintTreeNodeUtils.Display || (ConstraintTreeNodeUtils.Display = {}));
})(ConstraintTreeNodeUtils || (ConstraintTreeNodeUtils = {}));
/**
    Functions for displaying raw variant of
    expression parse tape. Only for testing or debug,
    shall not be exported in parser index file.
*/
export var RawExpressionParseTapeUtils;
(function (RawExpressionParseTapeUtils) {
    let Display;
    (function (Display) {
        function asTreeFull(tape, tokenStrings, tokenMapping) {
            const trees = [];
            for (let i = 0; i < tape.constraints.length; i++) {
                const combinator = ExpressionCombinator[tape.combinators[i]];
                const root = tape.constraints[i];
                const obj = RawConstraintTreeNodeUtils.Display.treifyRepr(root, tokenStrings, tokenMapping);
                trees.push(combinator);
                trees.push(treeifyObject(obj, true));
            }
            return trees.join("\n");
        }
        Display.asTreeFull = asTreeFull;
    })(Display = RawExpressionParseTapeUtils.Display || (RawExpressionParseTapeUtils.Display = {}));
})(RawExpressionParseTapeUtils || (RawExpressionParseTapeUtils = {}));
/**
    Functions for displaying raw variant of
    constraint tree node, only for testing or debug,
    shall not be exported in parser index file.
*/
export var RawConstraintTreeNodeUtils;
(function (RawConstraintTreeNodeUtils) {
    let Display;
    (function (Display) {
        /**
            Converts a constraint tree nde into nested object representation
            that will be possible to display as string with treeify.
        */
        function treifyRepr(node, tokenStrings, tokenMapping) {
            const [rootIdx, rootVal] = treifyReprImpl(node, tokenStrings, tokenMapping);
            // handling special case for "implicit wildcard" constraint
            if (node.kind == ConstraintTreeNodeKind.IMPLICIT) {
                return { [rootIdx]: "(implicit) *" };
            }
            else {
                return { [rootIdx]: rootVal };
            }
        }
        Display.treifyRepr = treifyRepr;
        function treifyReprImpl(node, tokenStrings, tokenMapping) {
            const kindStr = ConstraintTreeNodeKind[node.kind];
            const rangeStr = ` [${node.range[0]}, ${node.range[1]}]`;
            const identifier = kindStr + rangeStr;
            // atom case 
            if (node.kind == ConstraintTreeNodeKind.ATOM) {
                const token = tokenStrings[tokenMapping[node.range[0]]];
                return [identifier, token];
            }
            // general case
            const result = {};
            for (const child of node.children) {
                const [childId, childObj] = treifyReprImpl(child, tokenStrings, tokenMapping);
                result[childId] = childObj;
            }
            return [identifier, result];
        }
    })(Display = RawConstraintTreeNodeUtils.Display || (RawConstraintTreeNodeUtils.Display = {}));
})(RawConstraintTreeNodeUtils || (RawConstraintTreeNodeUtils = {}));
