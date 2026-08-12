"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseWarningKind = void 0;
/**
    Enum of ParseWarning union discriminators
    each entry in the enum corresponds with
    a specific ParseWarning variant.
*/
var ParseWarningKind;
(function (ParseWarningKind) {
    ParseWarningKind[ParseWarningKind["BOGUS_PAIR"] = 0] = "BOGUS_PAIR";
    ParseWarningKind[ParseWarningKind["TEST"] = 1] = "TEST";
})(ParseWarningKind || (exports.ParseWarningKind = ParseWarningKind = {}));
