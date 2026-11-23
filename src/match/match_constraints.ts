import * as compiler from "./../compile/compiler_a_index.ts"
import * as json from "./../json/json_a_index.ts"

export function nodePassesConstraints(
	ast: json.JsonSyntaxTree,
	astIdx: number,
	expr: compiler.CompiledExpression,
	exprIdx: number,
): boolean {
	return true;
}