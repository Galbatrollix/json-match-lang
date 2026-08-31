import { treeifyObject } from "./../vendored/treeify.js";
import * as lexer from "./../lex/lexer_a_index.js";
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
    Each node in raw constraint tree must be one one of the following kinds.
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
    /**
        Contains functions for display purposes.
    */
    let Display;
    (function (Display) {
        /**
            Assembles a readable tree representation of expression parse tape.
            Requires its corresponding lexer.TokenTape to be provided as parameter.

            Third parameter - showAtomKinds is optional - if false or not provided,
            the result will have laconic description for ATOM nodes in the tree. If
            true is given, exact token kinds of each ATOM node will be displayed.

            Returns a string with newline separators that can be directly printed.
        */
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
    /**
        Contains functions for purposes of debugging and checking
        validity of ExpressionParseTape instances.
    */
    let Debug;
    (function (Debug) {
        function integrityCheckBasic(parseTape) {
            return (soaOk(parseTape)
                &&
                    constraintsOk(parseTape, Infinity)
                &&
                    pairsOk(parseTape));
        }
        Debug.integrityCheckBasic = integrityCheckBasic;
        function integrityCheckDeep(parseTape, tokenTape) {
            return (soaOk(parseTape)
                &&
                    constraintsOk(parseTape, tokenTape.tokenCount)
                &&
                    pairsOk(parseTape));
        }
        Debug.integrityCheckDeep = integrityCheckDeep;
        /**
            Returns true only if basic ExpressionParseTape structure is well-formed.
        */
        function soaOk(parseTape) {
            return (parseTape.pairCount == parseTape.constraints.length
                &&
                    parseTape.pairCount == parseTape.combinators.length);
        }
        /**
            Returns true only if all constraint trees in parse tape
            are well formed and contain token indexes lesser than tokenCount.
        */
        function constraintsOk(parseTape, tokenCount) {
            for (let i = 0; i < parseTape.pairCount; i++) {
                const valid = ConstraintTreeNodeUtils.Debug.integrityCheck(parseTape.constraints[i], tokenCount);
                if (!valid)
                    return false;
            }
            return true;
        }
        /**
            Returns true only if parse tape contains no invalid pairs
            Only invalid pair is implicit descednant combinator paired
            with implicit constraint. No such pair should ever be emitted.
        */
        function pairsOk(parseTape) {
            for (let i = 0; i < parseTape.pairCount; i++) {
                const constraint = parseTape.constraints[i];
                const combinator = parseTape.combinators[i];
                const fail = (combinator == ExpressionCombinator.DESCENDANT
                    &&
                        constraint.kind == ConstraintTreeNodeKind.IMPLICIT);
                if (fail)
                    return false;
            }
            return true;
        }
    })(Debug = ExpressionParseTapeUtils.Debug || (ExpressionParseTapeUtils.Debug = {}));
})(ExpressionParseTapeUtils || (ExpressionParseTapeUtils = {}));
/**
    Contains additional functions for handling ConstraintTreeNode values.
*/
export var ConstraintTreeNodeUtils;
(function (ConstraintTreeNodeUtils) {
    /**
        Contains functions for display purposes.
    */
    let Display;
    (function (Display) {
        /**
            Converts a constraint tree node into a nested object representation
            that will be possible to display as string with treeify. Or print as
            an object.
        */
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
    /**
        Contains functions for purposes of debugging and checking
        validity of ConstraintTreeNode instances.
    */
    let Debug;
    (function (Debug) {
        /**
            Returns true if constraint tree structure and contents
            are well-formed. Expects token count of token tape as a second
            parameter to perform additional checks.
        */
        function integrityCheck(root, tokenCount) {
            if (validImplicitNode(root)) {
                return true;
            }
            else {
                return traverseAndVerify(root, tokenCount - 1);
            }
        }
        Debug.integrityCheck = integrityCheck;
        /**
            Traverses entire constraint tree and looks for anomalies.
            Returns true only if tree structure is organized properly and no
            token index within tree is outside of range <0, maxTokenIdx>.
        
            Performs "explosive DFS traversal" algorithm using explicit stack
            to not run into a risk of function call stack overflow
        */
        function traverseAndVerify(root, maxTokenIdx) {
            const stack = [];
            let top = 0;
            // parens kind is used as a root's parent dummy item that won't
            // get into conflict with function's logic. 
            stack[top++] = [root, ConstraintTreeNodeKind.PARENS];
            // keep processing until all nodes have been visited and stack becomes empty
            while (top) {
                const [node, parentKind] = stack[--top];
                // early exit if a problem is found.
                if (!verifyNode(node, parentKind, maxTokenIdx)) {
                    return false;
                }
                // push all children onto the stack
                top = pushChildrenToStack(stack, node, top);
            }
            // traversed entire tree without finding erors, everything OK
            return true;
        }
        /**
            Takes all children of node and writes them to the stack array
            starting at position pointed to by a top parameter.
            Returns a number that points to first slot past the last written child.
            (returned value is essentially a new top)
        */
        function pushChildrenToStack(stack, node, top) {
            switch (node.kind) {
                case ConstraintTreeNodeKind.NOT:
                    stack[top++] = [node.child, node.kind];
                    return top;
                case ConstraintTreeNodeKind.AND:
                case ConstraintTreeNodeKind.OR:
                    for (const child of node.children) {
                        stack[top++] = [child, node.kind];
                    }
                    return top;
                default:
                    return top;
            }
        }
        /**
            Returns true if contents of a node are well formed internally
            and in relation to its parent node (kind) and maximum token index
            that is expected in the tree.
        
            If at least 1 aspect is not well-formed, returns false.
            This function re-asserts typescript's type signature because
            constraint trees are constructed by bypassing type system.
        */
        function verifyNode(node, parentKind, maxTokenIdx) {
            if (typeof node != 'object' || node === null) {
                return false;
            }
            const hasKind = Object.keys(node).includes("kind");
            if (!hasKind) {
                return false;
            }
            if (!Object.isFrozen(node)) {
                return false;
            }
            switch (node.kind) {
                case ConstraintTreeNodeKind.NOT:
                    return verifyNodeNot(node, parentKind);
                case ConstraintTreeNodeKind.AND:
                case ConstraintTreeNodeKind.OR:
                    return verifyNodeAndOr(node, parentKind);
                case ConstraintTreeNodeKind.ATOM:
                    return verifyNodeAtom(node, maxTokenIdx);
                // implicit cannot exist deep in the tree, it is handled at top level only
                case ConstraintTreeNodeKind.IMPLICIT:
                    return false;
                default:
                    node;
                    return false;
            }
        }
        /**
            Verifies integrity of NOT constraint tree node
            beyond TS typesystem "guarantees".
        */
        function verifyNodeNot(node, parentKind) {
            if (parentKind == ConstraintTreeNodeKind.NOT) {
                return false;
            }
            const keys = Object.keys(node);
            if (keys.length != 2) {
                return false;
            }
            if (!keys.includes('child')) {
                return false;
            }
            return true;
        }
        /**
            Verifies integrity of OR, AND constraint tree nodes
            beyond TS typesystem "guarantees".
        */
        function verifyNodeAndOr(node, parentKind) {
            if (parentKind == node.kind) {
                return false;
            }
            const keys = Object.keys(node);
            if (keys.length != 2) {
                return false;
            }
            if (!keys.includes('children')) {
                return false;
            }
            //@ts-expect-error
            if (!Array.isArray(node.children)) {
                return false;
            }
            //@ts-expect-error
            if (node.children.length < 1) {
                return false;
            }
            return true;
        }
        /**
            Verifies integrity of ATOM constraint tree node
            beyond TS typesystem "guarantees".
        */
        function verifyNodeAtom(node, maxTokenIdx) {
            const keys = Object.keys(node);
            if (keys.length != 2) {
                return false;
            }
            if (!keys.includes('tokenIdx')) {
                return false;
            }
            //@ts-expect-error
            if (!Number.isInteger(node.tokenIdx)) {
                return false;
            }
            //@ts-expect-error
            if (node.tokenIdx > maxTokenIdx || node.tokenIdx < 0) {
                return false;
            }
            return true;
        }
        /**
            Returns true if given constraint tree node is a valid
            implicit node. Shall be called outside tree traversal.
 
            Verifies integrity beyond TS type system "guarantees".
        */
        function validImplicitNode(node) {
            if (typeof node != 'object' || node === null) {
                return false;
            }
            if (!Object.isFrozen(node)) {
                return false;
            }
            const keys = Object.keys(node);
            const hasKind = keys.includes("kind");
            if (!hasKind) {
                return false;
            }
            if (keys.length != 1) {
                return false;
            }
            if (node.kind != ConstraintTreeNodeKind.IMPLICIT) {
                return false;
            }
            return true;
        }
    })(Debug = ConstraintTreeNodeUtils.Debug || (ConstraintTreeNodeUtils.Debug = {}));
    /**
        Contains general purpose utility functions such as
        constraint tree iterator.
    */
    let Misc;
    (function (Misc) {
        /**
            Returns an iterator that traverses constraint tree using a stack-based
            explosive DFS. For each traversed node returns a pair of
            the node itself and index of its parent node (in the iterable).

            Performs pre-order traversal. When node has multiple children
            the one with the lowest index is visited first.
        
            Parent of root is labeled as NaN.
            In the end the iterator returns a count of emitted nodes.
        */
        function* iter(root) {
            const stack = [];
            let top = 0;
            let nodesVisited = 0;
            stack[top++] = [root, NaN];
            while (top) {
                // pop the item from stack and emit it
                const [node, parentIdx] = stack[--top];
                yield [node, parentIdx];
                // obtain all children of popped node
                let children = [];
                switch (node.kind) {
                    case ConstraintTreeNodeKind.NOT:
                        children = [node.child];
                        break;
                    case ConstraintTreeNodeKind.OR:
                    case ConstraintTreeNodeKind.AND:
                        children = node.children;
                        break;
                    default:
                        children = [];
                }
                // append children to the stack in reverse order.
                for (let i = children.length - 1; i >= 0; i--) {
                    stack[top++] = [children[i], nodesVisited];
                }
                // increment nodes visited by one for each popped item
                nodesVisited += 1;
            }
            return nodesVisited;
        }
        Misc.iter = iter;
    })(Misc = ConstraintTreeNodeUtils.Misc || (ConstraintTreeNodeUtils.Misc = {}));
})(ConstraintTreeNodeUtils || (ConstraintTreeNodeUtils = {}));
/*

    UNEXPORTED STUFF ONLY FOR DEBUGGING BELOW

*/
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
