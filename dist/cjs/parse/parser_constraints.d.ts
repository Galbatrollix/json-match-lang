import { type RawConstraintTreeNode } from "./parser_types.ts";
import * as lexer from "./../lex/lexer_a_index.ts";
/**
    Top level function that will be called by the main
    parser once a constraint block must be handled.
    
    If parse succeded, returns: {RawConstraintTreeNode, consumedTokens}
    If parse failed, returns: undefined
    
*/
export declare function parseConstraintsTopLevel(tokens: Readonly<Array<lexer.TokenKind>>, start: number): {
    constraint: RawConstraintTreeNode;
    consumed: number;
    success: boolean;
};
//# sourceMappingURL=parser_constraints.d.ts.map