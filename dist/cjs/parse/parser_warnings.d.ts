/**
    Enum of ParseWarning union discriminators
    each entry in the enum corresponds with
    a specific ParseWarning variant.
*/
export declare enum ParseWarningKind {
    BOGUS_PAIR = 0,
    TEST = 1
}
export declare namespace ParseWarningVariants {
    type BogusPair = {
        kind: ParseWarningKind.BOGUS_PAIR;
        tokenIndexes: Array<number>;
    };
    type Test = {
        kind: ParseWarningKind.TEST;
        tokenIndexes: Array<number>;
    };
}
export type ParseWarning = Readonly<ParseWarningVariants.BogusPair | ParseWarningVariants.Test>;
//# sourceMappingURL=parser_warnings.d.ts.map