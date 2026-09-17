

/**
	unfucked version of base.push(...ext), no risk of stack overflow
*/
export function arrayExtend<T>(base: Array<T>, ext: Readonly<Array<T>>){
	const oldLength = base.length;
	const newLength = base.length + ext.length;

	// making more space	
	base.length = newLength;
	
	// filling items from ext to base
	for (let i = oldLength; i < newLength; i++){
		base[i] = ext[i - oldLength];
	}
}


/**
	Returns true if given arrays are the same length
	and for every i >= 0 && i < length
	arr1[i] == arr2[i]
	
	Otherwise returns false.
*/
export function primitiveArrayEquals<T>(
	arr1: Readonly<Array<T>>,
	arr2: Readonly<Array<T>>,
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

export type Writable<T> = { -readonly [Key in keyof T]: T[Key] };