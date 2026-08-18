import { type ExpressionParseTape } from "./parser_types.ts";
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
    
    Modifies parse tape in place. Returns nothing.
    
*/
export declare function postprocessCollapseTreesInPlace(parseTape: ExpressionParseTape): void;
//# sourceMappingURL=parser_postprocess.d.ts.map