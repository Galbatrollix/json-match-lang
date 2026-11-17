import * as lexer from "./../lex/lexer_a_index.ts"
import * as parser from "./../parse/parser_a_index.ts"


export type TrivialValueProperties = Readonly<{
	allowArr:     boolean,
	allowObj:     boolean,
	allowNull:    boolean,
	allowTrue:    boolean,
	allowFalse:   boolean,
	allowString:  boolean,
	allowNumber:  boolean,
}>;


export enum CompiledConstraintDataKind {
	WILDCARD,
	OR,
	AND,
	NOT,
	KEY,
	INDEX,
	VALUE_TRIVIAL,
	VALUE_STRING,
	VALUE_NUMBER,
};

export type CompiledConstraintData = Readonly<
	{	
		kind: CompiledConstraintDataKind.OR,
	} | {
		kind: CompiledConstraintDataKind.AND,
	} | {
		kind: CompiledConstraintDataKind.NOT,
	} | {
		kind: CompiledConstraintDataKind.WILDCARD,
	} | {
		kind: CompiledConstraintDataKind.KEY,
		pattern: string,
	} | {
		kind: CompiledConstraintDataKind.INDEX,
		arrAllowed: boolean,
		objAllowed: boolean,
		siblingIndex: number | undefined,
	} | {
		kind: CompiledConstraintDataKind.VALUE_TRIVIAL,
		properties: TrivialValueProperties,
	} | {
		kind: CompiledConstraintDataKind.VALUE_STRING,
		pattern: string,
	} | {
		kind: CompiledConstraintDataKind.VALUE_NUMBER,
		pattern: string,
	} 
>;


export type CompiledConstraintNode = Readonly<{
	parent: number,
	children: Readonly<Array<number>>,
	data: CompiledConstraintData,
}>;

export type CompiledConstraint = Readonly<Array<CompiledConstraintNode>>;


export type CompiledExpression = Readonly<{
	size: number,

	combinators: Readonly<Array<parser.ExpressionCombinator>>,
	constraints: Readonly<Array<CompiledConstraint>>,
	minDepths:   Readonly<Array<number>>,
	childDepths: Readonly<Array<number>>,
}> & { _?: never };