import * as lexer from "./../lex/lexer_a_index.ts"
import * as parser from "./../parse/parser_a_index.ts"


export const PropertyStatus = {
	UNDEFINED:        0,
	CANNOT_PASS:      1,
	MAY_PASS:         2,
} as const;
export type PropertyStatus = (typeof PropertyStatus)[keyof typeof PropertyStatus];



export type CompiledConstraintProperties = Readonly<{
	trivial:      boolean,

	wildcard:     PropertyStatus,

	contextArr:   PropertyStatus,
	contextObj:   PropertyStatus,

	valueArr:     PropertyStatus,
	valueObj:     PropertyStatus,
	valueNull:    PropertyStatus,
	valueTrue:    PropertyStatus,
	valueFalse:   PropertyStatus,
	valueString:  PropertyStatus,
	valueNumber:  PropertyStatus,
}>

/**
	Constains keys of compiled constraint properties 
	type. Trivial and wildcard fields are excluded since they
	require somewhat special handling - not for generic loops.
*/
export const constraintPropertiesKeys  = [
	"contextArr",
	"contextObj",
	"valueArr",
	"valueObj",
	"valueNull",
	"valueTrue",
	"valueFalse",
	"valueString",
	"valueNumber",
] as const;

export enum CompiledConstraintNodeKind {
	LEAF,
	OR,
	AND,
	NOT,
};

export type CompiledConstraintNode = Readonly<{
	kind: CompiledConstraintNodeKind,
	parent: number,
	children: Readonly<Array<number>>,

	properties: CompiledConstraintProperties,
	siblingIndex: number | undefined,
	stringPattern: string | undefined,
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