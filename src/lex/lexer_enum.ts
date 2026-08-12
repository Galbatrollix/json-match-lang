/**
	All them types of tokens that lexing json path can possibly output.
	(...) means this is an example not the only possible value of the token
	<EOF> means end of string
*/
export enum TokenKind {
	ERROR,
	ERROR_INCOMPLETE_KEY,          // "dupa<EOF>  (...)
	ERROR_INCOMPLETE_OBJECT,       // {3<EOF> (...)
	ERROR_INCOMPLETE_ARRAY,        // [5<EOF> (...)
	ERROR_INCOMPLETE_VALUE,        // #strin<EOF> (...)
	
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
	KEY_QUOTED,                    // "dupa" (...)
	KEY_NAKED,                     // dupa   (...)
	INDEX_ALL,                     // 1234   (...)
	INDEX_ARRAY,                   // [1234] (...)
	INDEX_OBJECT,                  // {1234} (...)
	WILDCARD_ALL,                  // *
	WILDCARD_ARRAY,                // [*]
	WILDCARD_OBJECT,               // {*}
	
	// they match type of primitives
	VALUE_TYPE_WILDCARD,           // #*
	VALUE_TYPE_STRING,             // #string
	VALUE_TYPE_NUMBER,             // #number
	VALUE_TYPE_BOOLEAN,            // #boolean
	VALUE_TYPE_ARRAY,              // #[]
	VALUE_TYPE_OBJECT,             // #{}
	
	// they match exact values of primitives
	VALUE_EXACT_NULL,              // #null
	VALUE_EXACT_TRUE,              // #true
	VALUE_EXACT_FALSE,             // #false
	VALUE_EXACT_NUMBER,            // #124.2    (...)
	VALUE_EXACT_STRING,            // #"duuupa" (...)
}


/**
	Bunch of helpers for easier work with the monstrous enum.	
*/
export namespace TokenKindUtils {
	export function isError(t: TokenKind): boolean{
		return (TokenKind.ERROR <= t && t <= TokenKind.ERROR_INCOMPLETE_VALUE);
	}
	export function isErrorIncomplete(t: TokenKind): boolean{
		return (TokenKind.ERROR_INCOMPLETE_KEY <= t && t <= TokenKind.ERROR_INCOMPLETE_VALUE);
	}
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
	export function isValue(t: TokenKind): boolean{
		return (TokenKind.VALUE_TYPE_WILDCARD <= t && t <= TokenKind.VALUE_EXACT_STRING);
	}
	
}