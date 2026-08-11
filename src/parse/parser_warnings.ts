
export enum WarningKind {
	BOGUS_SEQUENCE,
	TEST,
}


export type WarningBogusSequence = {
	kind: WarningKind.BOGUS_SEQUENCE,
	tokenRanges: Array<[number, number]>,
}
export type WarningTest = {
	kind: WarningKind.TEST,
	tokenIndexes: Array<number>,
}

export type ParseWarning = WarningBogusSequence | WarningTest;