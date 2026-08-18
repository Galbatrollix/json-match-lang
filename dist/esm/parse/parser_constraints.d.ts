import { type ConstraintTreeNode } from "./parser_types.ts";
import * as lexer from "./../lex/lexer_main.ts";
/**
    Top level function that will be called by the main
    parser once a constraint block must be handled.
    
    If parse succeded, returns: {ConstraintTreeNode, consumedTokens}
    If parse failed, returns: undefined
    
*/
export declare function parseConstraintsTopLevel(tokens: Readonly<Array<lexer.TokenKind>>, start: number): {
    constraint: ConstraintTreeNode;
    consumed: number;
    success: boolean;
};
//# sourceMappingURL=parser_constraints.d.ts.map