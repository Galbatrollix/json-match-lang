import * as compiler from "./../compile/compiler_a_index.ts"
import * as json from "./../json/json_a_index.ts"

export function nodePassesConstraints(
	expr: compiler.CompiledExpression,
	exprIdx: number,
	ast: json.JsonSyntaxTree,
	astIdx: number,
): boolean {
	return true;
}