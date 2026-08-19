import { type RawExpressionParseTape, type ExpressionParseTape } from "./parser_types.ts";
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
export declare function postprocessCollapseTreesInPlace(parseTape: RawExpressionParseTape): void;
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
export declare function postprocessTransformRawTapeToFinal(rawTape: RawExpressionParseTape, tokenMapping: Readonly<Array<number>>): ExpressionParseTape;
//# sourceMappingURL=parser_postprocess.d.ts.map