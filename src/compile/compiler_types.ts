import * as lexer from "./../lex/lexer_a_index.ts"
import * as parser from "./../parse/parser_a_index.ts"



// export type ConstraintTreeNode = Readonly<
// 	{
// 		kind: ConstraintTreeNodeKind.OR,
// 		children: Readonly<Array<ConstraintTreeNode>>,
// 	} |	{
// 		kind: ConstraintTreeNodeKind.AND,
// 		children: Readonly<Array<ConstraintTreeNode>>,
// 	} | {
// 		kind: ConstraintTreeNodeKind.NOT,
// 		child: ConstraintTreeNode,
// 	} | {
// 		kind: ConstraintTreeNodeKind.ATOM,
// 		tokenIdx: number,
// 	} | {
// 		kind: ConstraintTreeNodeKind.IMPLICIT,
// 	}
// >;
// export type ExpressionParseTape = Readonly<{
// 	pairCount: number,
// 	combinators: Readonly<Array<ExpressionCombinator>>,
// 	constraints: Readonly<Array<ConstraintTreeNode>>,
// }> & { _?: never };

// type CompiledConstraint = undefined;

// type CompiledExpression = {
// 	pairCount: number,

// 	depths: Array<[number, number]>,
// 	combinators: Array<number>,
// 	constraints: Array<CompiledConstraint>, 
// };