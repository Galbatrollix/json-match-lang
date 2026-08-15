

/**
	Enum representing all possible combinators (aka relations between
	adjacent contraint blocks in the json match lang expression)
*/
export enum ExpressionCombinator {
	DESCENDANT,   // represented as absence of operator between two constraints
	CHILD,              // TokenKind.OPERATOR_CHILD
	PARENT,             // TokenKind.OPERATOR_PARENT

	SIBLING_NEXT,       // TokenKind.OPERATOR_SIBLING_NEXT
	SIBLING_PREV,       // TokenKind.OPERATOR_SIBLING_PREV
	SIBLING_SUBSEQUENT, // TokenKind.OPERATOR_SIBLING_SUBSEQUENT
	SIBLING_PRECEDING,  // TokenKind.OPERATOR_SIBLING_PRECEDING
	SIBLING_ANY,        // TokenKind.OPERATOR_SIBLING_ANY
}

/**
	Each node in constraint tree must be one one of the following kinds.
*/
export enum ConstraintTreeNodeKind {
	ATOM,         // has always 0 children
	PARENS,       // has always 1 child
	NOT,          // has always 1 child
	AND,          // has at least 1 child
	OR,           // has at least 1 child
}

/**
	Kind describes type of the tree node.

	Range describes (filtered) index range of tokens
	that spans the tree node and all its children. 
	
	Children array describes 0 or more children of the current node.
*/
export type ConstraintTreeNode = {
	kind: ConstraintTreeNodeKind,
	range: [number, number],
	children: Array<ConstraintTreeNode>,
	
}
