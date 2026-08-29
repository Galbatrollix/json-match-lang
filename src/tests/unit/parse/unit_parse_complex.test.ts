import {lexer} from "../../../main.ts"
import {parser} from "../../../main.ts"

/**
	A type that represents a constraint tree structure via an array
	of constraint node kinds and indexes to their parents. (SOA)

	parent of root must be set to NaN.
*/
type FlatConstraintTreeStructure = {
	kinds: Readonly<Array<parser.ConstraintTreeNodeKind>>,
	parents: Readonly<Array<number>>,
}

// alias for more laconic inline data
const ck = parser.ConstraintTreeNodeKind;
/**
	This collection pairs expected syntax tree structures of constraint blocks
	with expression strings that yield a single-pair tape with constraint block
	of the expected structure. 

	A string producing multiple-pair parse tapes is not valid (and shall fail the tests)
	Likewise, a string that produces a parser error is invalid.
*/
const expectedConstraintTreeStructures: Readonly<Array<{
	expectedTreeOrder: FlatConstraintTreeStructure,
	expressionStrings: Readonly<Array<string>>,
}>> = [
	{
		expectedTreeOrder: {
			kinds: [ck.IMPLICIT],
			parents: [NaN],
		},
		expressionStrings: [
			`>`, `<`, '+', '++', `-`, `--`, `~`,
		],
	},
	{
		expectedTreeOrder: {
			kinds: [ck.ATOM],
			parents: [NaN],
		},
		expressionStrings: [
			`> #3.1415e-100000000000000000000000`,
			`< 3`,
			`{999}`,
			`dupa`,
			`++"GOO\u1234PA"`,
			`!!A`,
			`((B))`,
			`~ !(!(C))`,
		],
	},
	{
		expectedTreeOrder: {
			kinds: [ck.OR, ck.ATOM, ck.ATOM],
			parents: [NaN, 0, 0],
		},
		expressionStrings: [
			`((dupa)) | siki`,
			`~dupa | siki`,
			`!! kupa | !!czort`,
			`( #string | !!{0})`,
			
		],
	},
	{
		expectedTreeOrder: {
			kinds: [ck.AND, ck.ATOM, ck.ATOM, ck.ATOM, ck.ATOM],
			parents: [NaN, 0, 0, 0, 0],
		},
		expressionStrings: [
			` A & B & C & D`,
			` ++dupa & kupa & (siki & czort)`,
			`({0} & !!* & [*] & nothing)`,
		],
	},
	{
		expectedTreeOrder: {
			kinds: [ck.OR, ck.ATOM, ck.ATOM, ck.ATOM, ck.ATOM],
			parents: [NaN, 0, 0, 0, 0],
		},
		expressionStrings: [
			` A | B | C | D`,
			` ++dupa | kupa | (siki | czort)`,
			`({0} | !!* | [*] | nothing)`,
		],
	},
	{
		expectedTreeOrder: {
			kinds: [ck.NOT, ck.ATOM],
			parents: [NaN, 0],
		},
		expressionStrings: [
			`!x`,
			`+!#"dup"`,
			`!!!5`,
			`>!([10])`,
			`(!{*})`,
			`(!(!!test))`,
		],
	},
	{
		expectedTreeOrder: {
			kinds: [ck.OR, ck.AND, ck.ATOM, ck.ATOM, ck.AND, ck.ATOM, ck.ATOM],
			parents: [NaN, 0, 1, 1, 0, 4, 4],
		},
		expressionStrings: [
			` 1 & "5" | 2 & "3"`,
			` !!dupa & kupa | (siki & !!czort)`,
			` > ((( 1 & 2)) | (3 & 4))`,
		],
	},
	{
		expectedTreeOrder: {
			kinds: [ck.OR, ck.ATOM, ck.AND, ck.ATOM, ck.ATOM, ck.AND, ck.ATOM, ck.ATOM],
			parents: [NaN, 0, 0, 2, 2, 0, 5, 5],
		},
		expressionStrings: [
			`A | B & C | D & E`,
			`> (1 |! !A &#string|{0}     & !!3)`,
		],
	},
	{
		expectedTreeOrder: {
			kinds: [ck.AND, ck.OR, ck.ATOM, ck.ATOM, ck.OR, ck.ATOM, ck.ATOM],
			parents: [NaN, 0, 1, 1, 0, 4, 4],
		},
		expressionStrings: [
			` (1 | 2) & ("A" | "B")`,
			`< !!(A | !!B) & ((({0} | !!!![0])))`,
		],
	},
	{
		expectedTreeOrder: {
			kinds: [],
			parents: [],
		},
		expressionStrings: [

		],
	},
	// last is left empty for easy copypaste ))), it doesnt interfere with tests
];

/**
	Verifies whether structure of constraint trees in
	expectedConstraintTreeStructures collection matches with what is expected.

	Exact tokens of atom values are irrelevant - only the structure is checked.
	Also fails if strings emit parse erors or a parse tape longer than one. 
	(This should never happen as per above collection's definition) 
*/
export function parseTestConstraintsStructure(): boolean {
	for (const  {expectedTreeOrder, expressionStrings} of expectedConstraintTreeStructures){
		for (const exprString of expressionStrings){
			
			const lexTape: lexer.TokenTape = lexer.tokenizeExpressionString(exprString);
			const {parseTape, errors} = parser.parseExpressionTokens(lexTape);
			
			// check if collection invariants are satisfied
			if (errors.length != 0 || parseTape.pairCount != 1){
				return false;
			}

			// check if parseTape is well formed
			const tapeOk = parser.ExpressionParseTapeUtils.Debug.integrityCheckDeep(
				parseTape, lexTape,
			);
			if (! tapeOk){
				return false;
			}
		
			// verify tree structure is as expected
			const root: parser.ConstraintTreeNode = parseTape.constraints[0];
			const structureOk = treeStructuresTheSame(root, expectedTreeOrder);
			if (! structureOk){
				return false;
			}
		
		}

	}

	return true;
}

/**
	Compares structure of a constraint tree from parseTape
	with expected flat-encoded tree structure. 

	Returns true only if both structures match exactly.
*/
function treeStructuresTheSame(
	tree: parser.ConstraintTreeNode,
	expected: FlatConstraintTreeStructure,
): boolean {
	const iter = parser.ConstraintTreeNodeUtils.Misc.iter(tree);
	const maxIndex = expected.kinds.length - 1;
	let atIndex = 0;

	for (const [node, parentIdx] of iter){
		if (atIndex > maxIndex){
			return false;
		}	
		if (node.kind != expected.kinds[atIndex]){
			return false;
		}
		
		const parentOk: boolean = (
			Number.isNaN(parentIdx) && Number.isNaN(expected.parents[atIndex])
			|| 
			parentIdx == expected.parents[atIndex]
		);
			
		if(! parentOk){
			return false;
		}

		atIndex += 1;
	}
	
	return true;
}
// alias for more laconic inline data
const ec = parser.ExpressionCombinator;
/**
	This collection pairs expected combinator arrays
	with expression strings that are supposed to yield them
*/
const expectedCombinatorContents: Readonly<Array<{
	expectedCombinators: Readonly<Array<parser.ExpressionCombinator>>,
	expressionStrings: Readonly<Array<string>>,
}>> = [
	{
		expectedCombinators: [ec.DESCENDANT],
		expressionStrings: [
			`{999}`,
			`((B))`,
			`( #string | !!{0})`,
			`({0} | !!* | [*] | nothing)`,
			`(!{*})`,
			`(!(!!test))`,
			` 1 & "5" | 2 & "3"`,
			` !!dupa & kupa | (siki & !!czort)`,
			`A | B & C | D & E`,
			` (1 | 2) & ("A" | "B")`,
		],
	},
	{
		expectedCombinators: [ec.CHILD],
		expressionStrings: [
			`>`,
			`>{999}`,
			`>((B))`,
			`>( #string | !!{0})`,
			`>({0} | !!* | [*] | nothing)`,
			`>(!{*})`,
			`>(!(!!test))`,
			`> 1 & "5" | 2 & "3"`,
			`> !!dupa & kupa | (siki & !!czort)`,
			`>A | B & C | D & E`,
			`> (1 | 2) & ("A" | "B")`,
		],
	},
	{
		expectedCombinators: [ec.PARENT],
		expressionStrings: [
			`<`,
			`<{999}`,
			`<((B))`,
			`<( #string | !!{0})`,
			`<({0} | !!* | [*] | nothing)`,
			`<(!{*})`,
			`<(!(!!test))`,
			`< 1 & "5" | 2 & "3"`,
			`< !!dupa & kupa | (siki & !!czort)`,
			`<A | B & C | D & E`,
			`< (1 | 2) & ("A" | "B")`,
		],
	},
	{
		expectedCombinators: [ec.SIBLING_NEXT],
		expressionStrings: [
			`+`,
			`+{999}`,
			`+((B))`,
			`+( #string | !!{0})`,
			`+({0} | !!* | [*] | nothing)`,
			`+(!{*})`,
			`+(!(!!test))`,
			`+ 1 & "5" | 2 & "3"`,
			`+ !!dupa & kupa | (siki & !!czort)`,
			`+A | B & C | D & E`,
			`+ (1 | 2) & ("A" | "B")`,
		],
	},
	{
		expectedCombinators: [ec.SIBLING_PREV],
		expressionStrings: [
			`-`,
			`-{999}`,
			`-((B))`,
			`-( #string | !!{0})`,
			`-({0} | !!* | [*] | nothing)`,
			`-(!{*})`,
			`-(!(!!test))`,
			`- 1 & "5" | 2 & "3"`,
			`- !!dupa & kupa | (siki & !!czort)`,
			`-A | B & C | D & E`,
			`- (1 | 2) & ("A" | "B")`,
		],
	},
	{
		expectedCombinators: [ec.SIBLING_SUBSEQUENT],
		expressionStrings: [
			`++`,
			`++{999}`,
			`++((B))`,
			`++( #string | !!{0})`,
			`++({0} | !!* | [*] | nothing)`,
			`++(!{*})`,
			`++(!(!!test))`,
			`++ 1 & "5" | 2 & "3"`,
			`++ !!dupa & kupa | (siki & !!czort)`,
			`++A | B & C | D & E`,
			`++ (1 | 2) & ("A" | "B")`,
		],
	},
	{
		expectedCombinators: [ec.SIBLING_PRECEDING],
		expressionStrings: [
			`--`,
			`--{999}`,
			`--((B))`,
			`--( #string | !!{0})`,
			`--({0} | !!* | [*] | nothing)`,
			`--(!{*})`,
			`--(!(!!test))`,
			`-- 1 & "5" | 2 & "3"`,
			`-- !!dupa & kupa | (siki & !!czort)`,
			`--A | B & C | D & E`,
			`-- (1 | 2) & ("A" | "B")`,
		],
	},
	{
		expectedCombinators: [ec.SIBLING_ANY],
		expressionStrings: [
			`~`,
			`~{999}`,
			`~((B))`,
			`~( #string | !!{0})`,
			`~({0} | !!* | [*] | nothing)`,
			`~(!{*})`,
			`~(!(!!test))`,
			`~ 1 & "5" | 2 & "3"`,
			`~ !!dupa & kupa | (siki & !!czort)`,
			`~A | B & C | D & E`,
			`~ (1 | 2) & ("A" | "B")`,
		],
	},
	{
		expectedCombinators: [ec.CHILD, ec.DESCENDANT],
		expressionStrings: [
			`> #"descendant_after_this" lamao`,
			`> #"descendant_after_this"{999}`,
			`> #"descendant_after_this"((B))`,
			`> #"descendant_after_this"( #string | !!{0})`,
			`> #"descendant_after_this"({0} | !!* | [*] | nothing)`,
			`> #"descendant_after_this"(!{*})`,
			`> #"descendant_after_this"(!(!!test))`,
			`> #"descendant_after_this" 1 & "5" | 2 & "3"`,
			`> #"descendant_after_this" !!dupa & kupa | (siki & !!czort)`,
			`> #"descendant_after_this"A | B & C | D & E`,
			`> #"descendant_after_this" (1 | 2) & ("A" | "B")`,
		],
	},
	{
		expectedCombinators: [ec.CHILD, ec.CHILD, ec.CHILD],
		expressionStrings: [
			`>>>`,
			`> dupa > kupa > siki`,
			`> dupa | kupa > siki > czort & !targa`,
		],
	},
	{
		expectedCombinators: [ec.CHILD, ec.DESCENDANT],
		expressionStrings: [
			`> (1 | 2) & ("A" | "B") "string"`,
			`>**`,
			`> DUPA KUPA`,
			` > SIKI | CZORT #0.1415e-314`,
		],
	},
	{
		expectedCombinators: [ec.SIBLING_SUBSEQUENT, ec.SIBLING_SUBSEQUENT],
		expressionStrings: [
			`++++`,
			`++ ++`,
			`++ dupa | kupa ++`,
		],
	},
	{
		expectedCombinators: [ec.SIBLING_PRECEDING, ec.SIBLING_PRECEDING],
		expressionStrings: [
			`----`,
			`-- --`,
			`-- dupa | kupa --`,
		],
	},
	{
		expectedCombinators: [ec.SIBLING_SUBSEQUENT, ec.SIBLING_SUBSEQUENT, ec.SIBLING_NEXT],
		expressionStrings: [
			`+++++`,
			`++ ++ +`,
			`++ BYTES ++ OR + "TYPES?"`,
		],
	},
	{
		expectedCombinators: [ec.SIBLING_PRECEDING, ec.SIBLING_PRECEDING, ec.SIBLING_PREV],
		expressionStrings: [
			`-----`,
			`-- -- -`,
			`-- TYPES & BYTES -- ANGELS & WRAITHS -`,
		],
	},
	{
		expectedCombinators: [ec.SIBLING_PREV, ec.SIBLING_PREV],
		expressionStrings: [
			`- -`,
			`- item - anotheritem`,
			`  - ((BAKA)) - "TORIX = NULL"`,
		],
	},
	{
		expectedCombinators: [],
		expressionStrings: [
			
		],
	},
	// last is left empty for easy copypaste ))), it doesnt interfere with tests
];

/**
	Verifies whether contents of parseTape combinator arrays are as expected
	based on tables defined in expectedCombinatorContents.
*/
export function parseTestCombinatorsSequence(): boolean {
	for (const {expectedCombinators, expressionStrings} of expectedCombinatorContents){
		for (const exprString of expressionStrings){
			const lexTape: lexer.TokenTape = lexer.tokenizeExpressionString(exprString);
			const {parseTape, errors} = parser.parseExpressionTokens(lexTape);
			
			if (errors.length != 0){
				return false;
			}

			// check if parseTape is well formed
			const tapeOk = parser.ExpressionParseTapeUtils.Debug.integrityCheckDeep(
				parseTape, lexTape,
			);
			if (! tapeOk){
				return false;
			}

			if (! combinatorArraysTheSame(parseTape.combinators, expectedCombinators)){
				return false;
			}
		}
	}

	return true;
}

function combinatorArraysTheSame(
	arr1: Readonly<Array<parser.ExpressionCombinator>>,
	arr2: Readonly<Array<parser.ExpressionCombinator>>,
): boolean {
	if (arr1.length != arr2.length){
		return false;
	}

	for (let i = 0; i < arr1.length; i++){
		if (arr1[i] != arr2[i]){
			return false;
		}
	}

	return true;
}