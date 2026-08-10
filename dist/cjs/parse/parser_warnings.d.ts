export declare enum WarningKind {
    BOGUS_SEQUENCE = 0,
    TEST = 1
}
export type WarningBogusSequence = {
    kind: WarningKind.BOGUS_SEQUENCE;
    tokenRanges: Array<[number, number]>;
};
export type WarningTest = {
    kind: WarningKind.TEST;
    tokenIndexes: Array<number>;
};
export type Warning = WarningBogusSequence | WarningTest;
//# sourceMappingURL=parser_warnings.d.ts.map