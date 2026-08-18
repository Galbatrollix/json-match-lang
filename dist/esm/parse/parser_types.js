import { treeifyObject } from "./../vendored/treeify.js";
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
})(ConstraintTreeNodeKind || (ConstraintTreeNodeKind = {}));
export var ExpressionParseTapeUtils;
(function (ExpressionParseTapeUtils) {
    let Display;
    (function (Display) {
        function asTree(tape) {
            const trees = [];
            for (let i = 0; i < tape.constraints.length; i++) {
                const combinator = ExpressionCombinator[tape.combinators[i]];
                const root = tape.constraints[i];
                const obj = ConstraintTreeNodeUtils.Display.treeifyRepr(root);
                trees.push(combinator);
                trees.push(treeifyObject(obj, true));
            }
            return trees.join("\n");
        }
        Display.asTree = asTree;
        function asTreeFull(tape, tokenStrings, tokenMapping) {
            const trees = [];
            for (let i = 0; i < tape.constraints.length; i++) {
                const combinator = ExpressionCombinator[tape.combinators[i]];
                const root = tape.constraints[i];
                const obj = ConstraintTreeNodeUtils.Display.treeifyReprFull(root, tokenStrings, tokenMapping);
                trees.push(combinator);
                trees.push(treeifyObject(obj, true));
            }
            return trees.join("\n");
        }
        Display.asTreeFull = asTreeFull;
    })(Display = ExpressionParseTapeUtils.Display || (ExpressionParseTapeUtils.Display = {}));
})(ExpressionParseTapeUtils || (ExpressionParseTapeUtils = {}));
export var ConstraintTreeNodeUtils;
(function (ConstraintTreeNodeUtils) {
    let Display;
    (function (Display) {
        /**
            Converts a consraint tree node into nested object representation
            that will be possible to display as string with treeify.
        */
        function treeifyRepr(node) {
            const [rootIdx, rootVal] = nodeToTreeifyImpl(node);
            return { [rootIdx]: rootVal };
        }
        Display.treeifyRepr = treeifyRepr;
        /**
            Converts a constraint tree nde into nested object representation
            that will be possible to display as string with treeify.

            Unlike function treeifyRepr, includes atom token values in the result
        */
        function treeifyReprFull(node, tokenStrings, tokenMapping) {
            const [rootIdx, rootVal] = nodeToTreeifyFullImpl(node, tokenStrings, tokenMapping);
            // handling special case for "implicit wildcard" constraint
            // which has uniquely special property of range[0] == range[1]
            if (node.range[0] == node.range[1]) {
                return { [rootIdx]: "(implicit) *" };
            }
            else {
                return { [rootIdx]: rootVal };
            }
        }
        Display.treeifyReprFull = treeifyReprFull;
        /**
            Recursive function that constructs result for the nodeToTreeify function.
        */
        function nodeToTreeifyImpl(node) {
            const kindStr = ConstraintTreeNodeKind[node.kind];
            const rangeStr = ` [${node.range[0]}, ${node.range[1]}]`;
            const identifier = kindStr + rangeStr;
            const result = {};
            for (const child of node.children) {
                const [childId, childObj] = nodeToTreeifyImpl(child);
                result[childId] = childObj;
            }
            return [identifier, result];
        }
        function nodeToTreeifyFullImpl(node, tokenStrings, tokenMapping) {
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
                const [childId, childObj] = nodeToTreeifyFullImpl(child, tokenStrings, tokenMapping);
                result[childId] = childObj;
            }
            return [identifier, result];
        }
    })(Display = ConstraintTreeNodeUtils.Display || (ConstraintTreeNodeUtils.Display = {}));
})(ConstraintTreeNodeUtils || (ConstraintTreeNodeUtils = {}));
// {
//     oranges: {
//         'mandarin': {                       
//             clementine: null,               
//             tangerine: 'so cheap and juicy!'
//         }                                   
//     },                                      
//     apples: {                               
//         'gala': null,                       
//         'pink lady': null
//     }
// }
