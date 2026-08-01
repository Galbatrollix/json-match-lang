import {tokenizeJsonPathString} from "../main.ts"

const dupa = "𝒳+😂+😂";
console.log(`Dupa length: ${dupa.length}`);

for (let c of dupa){
	console.log(c, c.length);
}

console.log("===================");
for(let i = 0; i<dupa.length; i++) {
	const c = dupa[i];
	console.log(c, c.length);
}

console.log(Array.from(dupa));

const testt = "𝒳 12345 01 || + 😂+😂";
console.log(testt);
console.log(tokenizeJsonPathString(testt));