import { ConstraintTreeNodeKind, } from "./parser_types.js";
/**
    This function runs through each constraint abstract syntax tree
    in the tape and elliminates redundant nodes. A node is redundant if:
        - it has only one child that spans exactly the same token range
        OR
        - it is a parenthesis node
        OR
        - it is a negation node with a negation node child
        (both nodes - parent and child - are considered redundant in this case)
        OR
        - it is an and node that has an and node parent
        OR
        - it is a or node that has a or node parent

    Applies multiple transformations on the tree in an order that ensures
    end result has no redundant nodes as per above description.
    
    Modifies raw parse tape in place. Returns nothing.
    
*/
export function postprocessCollapseTreesInPlace(parseTape) {
    for (let i = 0; i < parseTape.constraints.length; i++) {
        collapseTreeStageOne(parseTape.constraints[i]);
        collapseTreeStageTwo(parseTape.constraints[i]);
        collapseTreeStageThree(parseTape.constraints[i]);
    }
}
/**
    DESTROYS provided RawExpressionParseTape and uses it to construct
    a regular (frozen, output version) of ExpressionParseTape.

    Token mapping array is used as a translation map between filtered token indexes
    contained withtin rawTape and original token indexes that must be held
    inside a transformed parse tape.
    
    Returns a fully frozen instance of ExpressionParseTape type.
    Raw tape given as input is DESTROYED because the algorithm implemented
    by this function operates completely in place.

    WARNING: This function makes a bitch out of the type system. Quite
    some "unsafe" stuff is performed here in the conversion process.
    Constraint array is basically transformed in-place into another type and
    subsequently casted. Nothing of honor is here, tread carefully.
*/
export function postprocessTransformRawTapeToFinal(rawTape, tokenMapping) {
    // convert constraint trees from raw to output form, bypassing type system
    for (let i = 0; i < rawTape.constraints.length; i++) {
        treeNodeFromRawUnsafeInPlace(rawTape.constraints[i], tokenMapping);
    }
    // cast the converted result into an appropriate type - welcome back to type-safety
    const convertedConstraints = rawTape.constraints;
    return Object.freeze({
        pairCount: rawTape.constraints.length,
        combinators: Object.freeze(rawTape.combinators),
        constraints: Object.freeze(convertedConstraints),
    });
}
/**
    Converts type of given root element from RawConstraintTreeNode
    to complete and frozen ConstraintTreeNode in place. Recursively
    applies transformation on all of root's children (...)
    Expects collapsed ConstraintTreeNode instance.
    Read more about what that means in postprocessCollapseTreesInPlace function.
    
    Uses tokenMapping lookup to convert filtered token indexes into original
    tokentape token indexes when necessary.
    
    Any is used as a root type to allow the dynamic type in-place conversion.
    Real type of input parametr is RawConstraintTreeNode. By the time function completes,
    root and all its children are of ConstraintTreeNode type.

    IMPORTANT: Root should be casted into ConstraintTreeNode type right after
    this function returns.
*/
function treeNodeFromRawUnsafeInPlace(root, tokenMapping) {
    // perform the operation on children first
    for (let i = 0; i < root.children.length; i++) {
        treeNodeFromRawUnsafeInPlace(root.children[i], tokenMapping);
    }
    // perform kind-specific transformations
    switch (root.kind) {
        case ConstraintTreeNodeKind.OR:
        case ConstraintTreeNodeKind.AND:
            Object.freeze(root.children);
            break;
        case ConstraintTreeNodeKind.NOT:
            root.child = root.children[0];
            delete root.children;
            break;
        case ConstraintTreeNodeKind.ATOM:
            root.tokenIdx = tokenMapping[root.range[0]];
            delete root.children;
            break;
        case ConstraintTreeNodeKind.IMPLICIT:
            delete root.children;
            break;
        default:
            throw new Error("Fatal error in tree node unsafe conversion");
    }
    // range is never preserved in ConstraintTreeNode regardless of node kind
    delete root.range;
    // root must be a frozen object
    Object.freeze(root);
}
/**
    Recursively destroys any parenthesis nodes or nodes
    that have only 1 child that spans the exact same token range.
*/
function collapseTreeStageOne(root) {
    let workingNode = root;
    // workingNode is basically used like a pointer to node
    for (;;) {
        const rootRange = workingNode.range;
        // if node has multiple children it is not elligible for collapsing
        if (workingNode.children.length != 1) {
            break;
        }
        const childRange = workingNode.children[0].range;
        const rangeTheSame = (rootRange[0] == childRange[0]
            &&
                rootRange[1] == childRange[1]);
        const isParenthesis = workingNode.kind == ConstraintTreeNodeKind.PARENS;
        // node is elligible for collapsing only if it has the same range or it is parenthesis
        if (!rangeTheSame && !isParenthesis) {
            break;
        }
        workingNode = workingNode.children[0];
    }
    // recursively invoke this function on all children of collapsed root.
    for (let i = 0; i < workingNode.children.length; i++) {
        collapseTreeStageOne(workingNode.children[i]);
    }
    // writing resulting state
    root.kind = workingNode.kind;
    root.range = workingNode.range;
    root.children = workingNode.children;
}
/**
    Recursively destroys any duplicate NOT nodes.
*/
function collapseTreeStageTwo(root) {
    let workingNode = root;
    // workingNode is basically used like a pointer to node
    for (;;) {
        // nots always have a single child, so via short circuit this is safe
        const pairOfNots = (workingNode.kind == ConstraintTreeNodeKind.NOT
            &&
                workingNode.children[0].kind == ConstraintTreeNodeKind.NOT);
        if (!pairOfNots) {
            break;
        }
        // if we got a pair of nots, replace fist not with its grandchild.
        workingNode = workingNode.children[0].children[0];
    }
    // recursively invoke this function on all children of collapsed root.
    for (let i = 0; i < workingNode.children.length; i++) {
        collapseTreeStageTwo(workingNode.children[i]);
    }
    // writing resulting state
    root.kind = workingNode.kind;
    root.range = workingNode.range;
    root.children = workingNode.children;
}
/**
    Recursively merges AND nodes that are children of AND parents
    into their parents. Likewise with OR nodes.
*/
function collapseTreeStageThree(root) {
    // perform the operation on children first
    for (let i = 0; i < root.children.length; i++) {
        collapseTreeStageThree(root.children[i]);
    }
    // exit right away if root node is not either OR or AND
    if (root.kind != ConstraintTreeNodeKind.OR
        && root.kind != ConstraintTreeNodeKind.AND) {
        return;
    }
    // forming a new array for flattened children
    const newChildren = [];
    for (let i = 0; i < root.children.length; i++) {
        const flattenCandidate = root.kind == root.children[i].kind;
        if (flattenCandidate) {
            arrayExtend(newChildren, root.children[i].children);
        }
        else {
            newChildren.push(root.children[i]);
        }
    }
    // overwriting children of root with newly constructed flattened children
    root.children = newChildren;
}
/**
    unfucked version of base.push(...ext), no risk of stack overflow
*/
function arrayExtend(base, ext) {
    const oldLength = base.length;
    const newLength = base.length + ext.length;
    // making more space	
    base.length = newLength;
    // filling items from ext to base
    for (let i = oldLength; i < newLength; i++) {
        base[i] = ext[i - oldLength];
    }
}
