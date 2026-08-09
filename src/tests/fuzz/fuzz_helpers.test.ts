/**
	Returns a random rumber in range <min, max)
*/
export function randomInRange(range: Readonly<[min:number, max:number]>): number{
	const [min, max] = range;
	const minCeiled = Math.ceil(min);
	const maxFloored = Math.floor(max);
	return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}



const unicodeRange = [0, 1114111 +1] as const;

/**
	Constructs a random valid unicode string of provided length
	(can have broken surrogate pairs and such)
*/
export function randomString(length: number): string {
	const toJoin: Array<string> = [];
	
	for(let i = 0; i < length; i++){
		toJoin.push(String.fromCodePoint(randomInRange(unicodeRange)));
	}

	return toJoin.join("");
}