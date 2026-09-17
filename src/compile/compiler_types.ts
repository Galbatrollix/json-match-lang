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
	} |	{
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

>


export type CompiledConstraintNode = Readonly<{
	//kind: CompiledConstraintDataKind,
	parent: number,
	children: Readonly<Array<number>>,
	data: CompiledConstraintData,

	// properties: CompiledConstraintProperties,
	// siblingIndex: number | undefined,
	// stringPattern: string | undefined,
}>;

export type CompiledConstraint = Readonly<Array<CompiledConstraintNode>>;

// export type CompiledConstraint = undefined;
export type CompiledCombinator = undefined;

export type CompiledExpression = {
	size: number,

	//depths: Array<[number, number]>,
	combinators: Readonly<Array<CompiledCombinator>>,
	constraints: Readonly<Array<CompiledConstraint>>,

};