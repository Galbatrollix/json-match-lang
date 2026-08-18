/**
    Enum representing all possible combinators (aka relations between
    adjacent contraint blocks in the json match lang expression)
*/
export declare enum ExpressionCombinator {
    DESCENDANT = 0,// represented as absence of operator between two constraints
    CHILD = 1,// TokenKind.OPERATOR_CHILD
    PARENT = 2,// TokenKind.OPERATOR_PARENT
    SIBLING_NEXT = 3,// TokenKind.OPERATOR_SIBLING_NEXT
    SIBLING_PREV = 4,// TokenKind.OPERATOR_SIBLING_PREV
    SIBLING_SUBSEQUENT = 5,// TokenKind.OPERATOR_SIBLING_SUBSEQUENT
    SIBLING_PRECEDING = 6,// TokenKind.OPERATOR_SIBLING_PRECEDING
    SIBLING_ANY = 7
}
/**
    Each node in constraint tree must be one one of the following kinds.
*/
export declare enum ConstraintTreeNodeKind {
    ATOM = 0,// has always 0 children
    PARENS = 1,// has always 1 child
    NOT = 2,// has always 1 child
    AND = 3,// has at least 1 child
    OR = 4
}
/**
    Kind describes type of the tree node.

    Range describes (filtered) index range of tokens
    that spans the tree node and all its children.
    
    Children array describes 0 or more children of the current node.
*/
export type ConstraintTreeNode = {
    kind: ConstraintTreeNodeKind;
    range: [number, number];
    children: Array<ConstraintTreeNode>;
};
/**
    Structure representing a successful parse output

    Json match lang expression's syntax is inherently linear -
        each constraint block follows a combinator
        and each combinator follows a constraint block (or expression beggining)
    Thanks to that property, combinators and constaints
    essentially come in pairs [combinator, constraint], ...

    hence: expression can be represented simply as two arrays:
        - combinators
        - contraints
    for any index i, (i < length):
        constraint[i] is constraint following the combinator at combinator[i]

*/
export type ExpressionParseTape = {
    combinators: Array<ExpressionCombinator>;
    constraints: Array<ConstraintTreeNode>;
};
export declare namespace ExpressionParseTapeUtils {
    namespace Display {
        function asTree(tape: ExpressionParseTape): string;
        function asTreeFull(tape: ExpressionParseTape, tokenStrings: Readonly<Array<string>>, tokenMapping: Readonly<Array<number>>): string;
    }
}
export declare namespace ConstraintTreeNodeUtils {
    namespace Display {
        /**
            Converts a consraint tree node into nested object representation
            that will be possible to display as string with treeify.
        */
        function treeifyRepr(node: ConstraintTreeNode): any;
        /**
            Converts a constraint tree nde into nested object representation
            that will be possible to display as string with treeify.

            Unlike function treeifyRepr, includes atom token values in the result
        */
        function treeifyReprFull(node: ConstraintTreeNode, tokenStrings: Readonly<Array<string>>, tokenMapping: Readonly<Array<number>>): any;
    }
}
//# sourceMappingURL=parser_types.d.ts.map