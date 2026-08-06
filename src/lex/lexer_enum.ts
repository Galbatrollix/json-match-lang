/*
	All them types of tokens that lexing json path can possibly output.
	(...) means this is an example not the only possible value of the token
*/
export enum TokenKind {
	ERROR,
	
	WHITESPACE,

	OPERATOR_CHILD,                // > 
	OPERATOR_PARENT,               // <
	
	OPERATOR_SIBLING_NEXT,         // +
	OPERATOR_SIBLING_PREV,         // -
	OPERATOR_SIBLING_SUBSEQUENT,   // ++
	OPERATOR_SIBLING_PRECEDING,    // --
	OPERATOR_SIBLING_ANY,          // ~

	OPERATOR_OR,                   // |
	OPERATOR_AND,                  // &
	OPERATOR_NOT,                  // !

	PARENTHESIS_LEFT,              // (
	PARENTHESIS_RIGHT,             // )
	
	// they match array indexes or object keys
	MATCH_KEY,                     // "dupa" (...)
	MATCH_KEY_NAKED,               // dupa   (...)
	MATCH_INDEX_ALL,               // 1234   (...)
	MATCH_INDEX_ARRAY,             // [1234] (...)
	MATCH_INDEX_OBJECT,            // {1234} (...)
	MATCH_WILDCARD_ALL,            // *
	MATCH_WILDCARD_ARRAY,          // [*]
	MATCH_WILDCARD_OBJECT,         // {*}
	
	// they match type of primitives
	PRIMITIVE_KIND_WILDCARD,       // #*
	PRIMITIVE_KIND_STRING,         // #string
	PRIMITIVE_KIND_NUMBER,         // #number
	PRIMITIVE_KIND_BOOLEAN,        // #boolean
	
	// they match exact values of primitives
	PRIMITIVE_NULL,                // #null
	PRIMITIVE_TRUE,                // #true
	PRIMITIVE_FALSE,               // #false
	PRIMITIVE_NUMBER,              // #124.2    (...)
	PRIMITIVE_STRING,              // #"duuupa" (...)
}


/* 
	Bunch of helpers attached to the enum for easier work
	with the monstrous enum.	
*/
export namespace enumUtils {
	export function isOperator(t: TokenKind): boolean{
		return (TokenKind.OPERATOR_CHILD <= t && t <= TokenKind.OPERATOR_NOT);
	}
	export function isOperatorLogical(t: TokenKind): boolean{
		return (TokenKind.OPERATOR_OR <= t && t <= TokenKind.OPERATOR_NOT);
	}
	export function isOperatorSibling(t: TokenKind): boolean{
		return (TokenKind.OPERATOR_SIBLING_NEXT <= t && t <= TokenKind.OPERATOR_SIBLING_ANY);
	}
	export function isOperatorParentChild(t: TokenKind): boolean{
		return (TokenKind.OPERATOR_CHILD <= t && t <= TokenKind.OPERATOR_PARENT);
	}
	export function isMatch(t: TokenKind): boolean{
		return (TokenKind.MATCH_KEY <= t && t <= TokenKind.MATCH_WILDCARD_OBJECT);
	}
	export function isPrimitive(t: TokenKind): boolean{
		return (TokenKind.PRIMITIVE_KIND_WILDCARD <= t && t <= TokenKind.PRIMITIVE_STRING);
	}
	
}