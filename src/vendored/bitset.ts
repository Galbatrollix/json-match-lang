// taken from my own repo https://github.com/Galbatrollix/dense-bit-set-js

/**
 	A 2d bitset data structure representing boolean state compactly. 
	Cannot be resized after construction.

	Constructor expects two positive integer arguments: dimensionX, dimensionY.
	highest permited value of (dimensionX * dimensionY) is Number.MAX_SAFE_INTEGER
	Constructor will throw RangeError if invalid dimensions are provided.
	Range error might be also thrown if ceil(dimensionX * dimensionY / 8) exceeds 
	platform-specific limit for length of Uint8Array.
	Once constructed, bitset is guaranteed to not throw any errors with correct usage.
	
	Main functions: 
		at(x, y) Returns true if bit at coordinates (x, y) is set, otherwise returns false. 
		
		set(x, y) sets a bit (sets to 1/true) at coordinates (x, y)
		unset(x, y) resets a bit (sets to 0/false) at coordinates (x, y)
		flip(x, y) negates a bit (1 becomes 0, 0 becomes 1) at coordinates (x,y)

		readSet(x, y) performs set(x, y) and returns previous value of written cell
		readUnset(x, y)	- analogous to readSet -
		readFlip(x, y)  - analogous to readSet -
	
	For all above functions:
		x must be an integer in range <0, dimX - 1>
		y must be an integer in range <0, dimY - 1>
	Behaviour of above functions is not specified if provided with  
	one or two incorrect inputs. Bound checks could be implemented but as this
	data structure is designed to be used in busy loops and hotspots, they would
	cause a significant slowdown in exchange for no benefit in correct code. 
	
	Other functions:
		setAll() writes 1/true to all cells in the bitset
		unsetAll() writes 0/false to all cells in the bitset
		copy() creates a deep copy of the bitset instance
*/
export class DenseBitSet2D {
	private readonly buffer: Uint8Array;

	readonly dimX: number;
	readonly dimY: number;
	
	/**
		Constructs 2D bitset object, both given dimensions must be positive integers.
		In event of invalid or too large inputs, will throw RangeError.
	*/
	constructor(dimensionX: number, dimensionY: number){
		errorOnWrongDimensions(dimensionX, dimensionY);

		const slots = Math.ceil(dimensionX * dimensionY / 8);
		this.buffer = new Uint8Array(slots);
		this.dimX = dimensionX;
		this.dimY = dimensionY;
	}
	/**
		Sets all values in the bitset to true
	*/
	setAll(): void {
		const slots = this.buffer.length;
		for (let i = 0; i < slots; i++){
			this.buffer[i] = 255;
		}
	}
	/**
		Sets all values in the bitset to false
	*/
	unsetAll(): void {
		const slots = this.buffer.length;
		for (let i = 0; i < slots; i++){
			this.buffer[i] = 0;
		}
	}
	/**
		Returns an independent identical object via deep copy 
	*/
	copy(): DenseBitSet2D {
		const result = new DenseBitSet2D(this.dimX, this.dimY);
		result.buffer.set(this.buffer);
		return result;
	}
	/**
		Returns boolean value of cell at coordinates (x, y) 
	*/
	at(x: number, y: number): boolean {
		const idx = y * this.dimX + x;
		const slot = Math.floor(idx / 8);
		const mask = 1 << (idx % 8);

		return !! (this.buffer[slot] & mask);
	}
	/**
		Sets cell at coordinates (x, y) to true
	*/
	set(x: number, y: number): void {
		const idx = y * this.dimX + x;
		const slot = Math.floor(idx / 8);
		const mask = 1 << (idx % 8);

		this.buffer[slot] |= mask;
	}
	
	/**
		Sets cell at coordinates (x, y) to false
	*/
	unset(x: number, y: number): void {
		const idx = y * this.dimX + x;
		const slot = Math.floor(idx / 8);
		const mask = 1 << (idx % 8);
	
		this.buffer[slot] &= (~ mask);
	}

	/**
		Inverts value of cell at coordinates (x, y)
	*/
	flip(x: number, y: number): void {
		const idx = y * this.dimX + x;
		const slot = Math.floor(idx / 8);
		const mask = 1 << (idx % 8);

		this.buffer[slot] ^= mask;
	}
	
	/**	
		Returns boolean value of cell at coordinates (x, y)
		AND
		Sets cell at coordinates (x, y) to true 
	*/
	readSet(x: number, y: number): boolean {
		const idx = y * this.dimX + x;
		const slot = Math.floor(idx / 8);
		const mask = 1 << (idx % 8);

		const result = !!(this.buffer[slot] & mask);
		this.buffer[slot] |= mask;

		return result;
	}
	/**	
		Returns boolean value of cell at coordinates (x, y)
		AND
		Sets cell at coordinates (x, y) to false 
	*/
	readUnset(x: number, y: number): boolean {
		const idx = y * this.dimX + x;
		const slot = Math.floor(idx / 8);
		const mask = 1 << (idx % 8);
		
		const result = !!(this.buffer[slot] & mask);
		this.buffer[slot] &= (~ mask);

		return result;
	}
	
	/**	
		Returns boolean value of cell at coordinates (x, y)
		AND
		Inverts value of cell at coordinates (x, y)
	*/
	readFlip(x: number, y: number): boolean {
		const idx = y * this.dimX + x;
		const slot = Math.floor(idx / 8);
		const mask = 1 << (idx % 8);

		const result = !!(this.buffer[slot] & mask);
		this.buffer[slot] ^= mask;

		return result;
	}
	
}	

/*
	Helper that will throw a RangeError if dimensions given to a
	DenseBitSet2D are invalid
*/
function errorOnWrongDimensions(dimensionX: number, dimensionY: number): void {
	if (! Number.isInteger(dimensionX)) {
		throw new RangeError(`dimensionX value (${dimensionX}) not an integer`)
	}
	if (! Number.isInteger(dimensionY)) {
		throw new RangeError(`dimensionY value (${dimensionY}) not an integer`)
	}
	
	if (dimensionX < 1) {
		throw new RangeError(`dimensionX value (${dimensionX}) not a positive integer`);
	}
	if (dimensionY < 1) {
		throw new RangeError(`dimensionY value (${dimensionY}) not a positive integer`);
	}
	
	if (Number.MAX_SAFE_INTEGER / dimensionX < dimensionY) {
		throw new RangeError(`Product of dimensionX and dimensionY exceeds Number.MAX_SAFE_INTEGER`);
	}

}


/*

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <https://unlicense.org>

*/