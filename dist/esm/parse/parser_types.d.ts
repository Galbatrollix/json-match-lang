import * as lexer from "./../lex/lexer_a_index.ts";
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
    OR = 4,// has at least 1 child
    IMPLICIT = 5
}
/**
    Represents raw form of constraint tree that is outputed
    by the parser implementation.
    
    Kind describes type of the tree node.

    Range describes (filtered) index range of tokens
    that spans the tree node and all its children.
    
    Children array describes 0 or more children of the current node.
*/
export type RawConstraintTreeNode = {
    kind: ConstraintTreeNodeKind;
    range: [number, number];
    children: Array<RawConstraintTreeNode>;
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
export type RawExpressionParseTape = {
    combinators: Array<ExpressionCombinator>;
    constraints: Array<RawConstraintTreeNode>;
};
/**
    Represents flattened and processed form of constraint tree
    formed from RawConstraintTreeNode after further processing.

    TokenIdx in atom kind item refers to an index in original
    token tape, not a filtered token index.

*/
export type ConstraintTreeNode = Readonly<{
    kind: ConstraintTreeNodeKind.OR;
    children: Readonly<Array<ConstraintTreeNode>>;
} | {
    kind: ConstraintTreeNodeKind.AND;
    children: Readonly<Array<ConstraintTreeNode>>;
} | {
    kind: ConstraintTreeNodeKind.NOT;
    child: ConstraintTreeNode;
} | {
    kind: ConstraintTreeNodeKind.ATOM;
    tokenIdx: number;
} | {
    kind: ConstraintTreeNodeKind.IMPLICIT;
}>;
/**
    Same as raw expression parse tape, but containing
    processed constraint trees.

    Exists only in readonly format and is closed to extension.
    
    pairCount == combinators.length == constraints.length
    
*/
export type ExpressionParseTape = Readonly<{
    pairCount: number;
    combinators: Readonly<Array<ExpressionCombinator>>;
    constraints: Readonly<Array<ConstraintTreeNode>>;
}> & {
    _?: never;
};
/**
    Contains additional functions for handling expression parse tape values.
*/
export declare namespace ExpressionParseTapeUtils {
    namespace Display {
        function asTree(parseTape: ExpressionParseTape, tokenTape: lexer.TokenTape, showAtomKinds?: boolean): string;
    }
}
export declare namespace ConstraintTreeNodeUtils {
    namespace Display {
        function treeifyRepr(node: ConstraintTreeNode, tokenTape: lexer.TokenTape, showAtomKinds: boolean): any;
    }
}
/**
    Functions for displaying raw variant of
    expression parse tape. Only for testing or debug,
    shall not be exported in parser index file.
*/
export declare namespace RawExpressionParseTapeUtils {
    namespace Display {
        function asTreeFull(tape: RawExpressionParseTape, tokenStrings: Readonly<Array<string>>, tokenMapping: Readonly<Array<number>>): string;
    }
}
/**
    Functions for displaying raw variant of
    constraint tree node, only for testing or debug,
    shall not be exported in parser index file.
*/
export declare namespace RawConstraintTreeNodeUtils {
    namespace Display {
        /**
            Converts a constraint tree nde into nested object representation
            that will be possible to display as string with treeify.
        */
        function treifyRepr(node: RawConstraintTreeNode, tokenStrings: Readonly<Array<string>>, tokenMapping: Readonly<Array<number>>): any;
    }
}
//# sourceMappingURL=parser_types.d.ts.map