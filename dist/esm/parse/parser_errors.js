/**
    Enum of ParseError union discriminators
    each entry in the enum corresponds with
    a specific ParseError variant.
*/
export var ParseErrorKind;
(function (ParseErrorKind) {
    ParseErrorKind[ParseErrorKind["FOUND_ERROR_TOKENS"] = 0] = "FOUND_ERROR_TOKENS";
    ParseErrorKind[ParseErrorKind["INDEX_OUT_OF_BOUNDS"] = 1] = "INDEX_OUT_OF_BOUNDS";
    ParseErrorKind[ParseErrorKind["STRING_NOT_VALID_JSON"] = 2] = "STRING_NOT_VALID_JSON";
})(ParseErrorKind || (ParseErrorKind = {}));
