import { WarningKind } from "./parser_warnings.js";
const warning = [];
switch (warning[0].kind) {
    case WarningKind.BOGUS_SEQUENCE:
        {
            warning[0].tokenRanges;
        }
        break;
    case WarningKind.TEST:
        {
            warning[0].tokenIndexes;
        }
        break;
    default: warning[0];
}
