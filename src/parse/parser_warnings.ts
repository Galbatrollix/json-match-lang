/**
	Enum of ParseWarning union discriminators
	each entry in the enum corresponds with
	a specific ParseWarning variant.
*/
export enum ParseWarningKind {
	BOGUS_PAIR,
	TEST,
}

export namespace ParseWarningVariants {
	export type BogusPair = {
		kind: ParseWarningKind.BOGUS_PAIR,
		tokenIndexes: Readonly<Array<number>>,
	}
	export type Test = {
		kind: ParseWarningKind.TEST,
		tokenIndexes: Readonly<Array<number>>,
	}
}


export type ParseWarning = Readonly < 
	ParseWarningVariants.BogusPair 
	| ParseWarningVariants.Test
>