
/**
	Vendored package from this repository:
		https://github.com/ts-essentials/ts-essentials

	It's only type-level utilities so the worst that can happen
	is program compilation issues.
*/

export type DeepWritable<Type> = Type extends Exclude<Builtin, Error>
  ? Type
  : Type extends Map<infer Key, infer Value>
  ? Map<DeepWritable<Key>, DeepWritable<Value>>
  : Type extends ReadonlyMap<infer Key, infer Value>
  ? Map<DeepWritable<Key>, DeepWritable<Value>>
  : Type extends WeakMap<infer Key, infer Value>
  ? WeakMap<DeepWritable<Key>, DeepWritable<Value>>
  : Type extends Set<infer Values>
  ? Set<DeepWritable<Values>>
  : Type extends ReadonlySet<infer Values>
  ? Set<DeepWritable<Values>>
  : Type extends WeakSet<infer Values>
  ? WeakSet<DeepWritable<Values>>
  : Type extends Promise<infer Value>
  ? Promise<DeepWritable<Value>>
  : Type extends {}
  ? DeepWritableObject<Type>
  : IsUnknown<Type> extends true
  ? unknown
  : Type;

type DeepWritableObject<Type> = {
  -readonly [Key in keyof Type]: Key extends typeof Symbol.iterator
    ? Type[Key] extends () => Iterator<infer IteratorType, infer Return, infer Next>
      ? () => Iterator<DeepWritable<IteratorType>, DeepWritable<Return>, DeepWritable<Next>>
      : DeepWritable<Type[Key]>
    : DeepWritable<Type[Key]>;
};


type IsAny<Type> = 0 extends 1 & Type ? true : false;
type IsUnknown<Type> = IsAny<Type> extends true ? false : unknown extends Type ? true : false;
type Builtin = Primitive | Function | Date | Error | RegExp;
type Primitive = string | number | boolean | bigint | symbol | undefined | null;

/*
The MIT License

Copyright (c) 2018-2019 Chris Kaczor (github.com/krzkaczor)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/