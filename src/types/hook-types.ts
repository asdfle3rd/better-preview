import { Page, Post, PostRevision } from '@wordpress/core-data';

/**
 * Transforms an object type by wrapping the return type of all its methods in a `Promise`.
 * * - **Methods**: Arguments (`A`) are inferred and preserved. Return type `R` becomes `Promise<R>`.
 * - **Async Handling**: Uses `Awaited<R>` to ensure we don't create `Promise<Promise<T>>`.
 * - **Properties**: Non-function values are left unchanged.
 * * @template T - The source object type.
 */
export type Promisify<T> = {
	[K in keyof T]: T[K] extends (...args: infer A) => infer R
		? (...args: A) => Promise<Awaited<R>>
		: T[K];
};
/**
 * Note: We use a Template Literal Type pattern to detect whitespace in the overloads of the hook.
 * A recursive type approach would require the function to be
 * generic over the localstorage key type (K) to infer the literal value. However, since this hook
 * is often called with an explicit generic for State (useStateWithHistory<S>),
 * and TypeScript does not support partial type argument inference nicely, adding a
 * second generic would break existing call sites or
 * require explicit typing of the key at the calling side.
 * The Template Literal pattern works effectively within the overload system.
 */
export type TWhitespaceChar = ' ' | '\t' | '\n' | '\r';
// Matches any string containing at least one whitespace character
export type TContainsWhitespace = `${string}${TWhitespaceChar}${string}`;
// 1. Define Whitespace characters (standard set)
export type TWhitespace = '' | ' ' | '\n' | '\t' | '\r';
// 2. Recursively trim the left side
export type TrimLeft<S extends string> = S extends `${TWhitespace}${infer Rest}`
	? TrimLeft<Rest>
	: S;
// 3. Recursively trim the right side
export type TrimRight<S extends string> =
	S extends `${infer Rest}${TWhitespace}` ? TrimRight<Rest> : S;
// 4. Combine them to get a full Trim
export type Trim<S extends string> = TrimRight<TrimLeft<S>>;
// 5. The Final Constraint Type
// If Trimming the string results in "", return 'never' (or a custom error)
// Otherwise, accept the string (T)
export type TNonEmptyString<T extends string = string> =
	Trim<T> extends '' ? never : T;

export type TSetStateFunctionWithArg<T> = (_: T) => T;
export type TSetStateFunctionNoArg<T> = () => T;
export type TSetStateAction<T> =
	| T
	| TSetStateFunctionNoArg<T>
	| TSetStateFunctionWithArg<T>;

export type TStorageOperation = 'read' | 'write' | 'remove';

export type TDefaultSerializer = JSON['stringify'];
export type TDefaultDeserializer<T> = (
	text: string,
	reviver?:
		| ((this: unknown, key: string, value: unknown) => unknown)
		| undefined
) => T;

export type TCustomSerializer<T> = (_: T) => string;
export type TCustomDeserializer<T> = (_: string) => T;

export type TRawSerializer = StringConstructor;
export type TRawDeserializer<T> = (_: string) => T;

export type TRawParser<T> = {
	serializer: TRawSerializer;
	deserializer: TRawDeserializer<T>;
};

export type TCustomxDefaultParserOptions<T> = {
	serializer: TCustomSerializer<T>;
	deserializer?: undefined;
};

export type TCustomxDefaultParser<T> = {
	serializer: TCustomSerializer<T>;
	deserializer: TDefaultDeserializer<T>;
};

export type TDefaultxCustomParserOptions<T> = {
	serializer?: undefined;
	deserializer: TCustomDeserializer<T>;
};

export type TDefaultxCustomParser<T> = {
	serializer: TDefaultSerializer;
	deserializer: TCustomDeserializer<T>;
};

export type TCustomParserOptions<T> = {
	serializer: TCustomSerializer<T>;
	deserializer: TCustomDeserializer<T>;
};
export type TCustomParser<T> = TCustomParserOptions<T>;

export type TDefaultParserOptions = {
	serializer: undefined;
	deserializer: undefined;
};
export type TDefaultParser<T> = {
	serializer: TDefaultSerializer;
	deserializer: TDefaultDeserializer<T>;
};

export type TRawParserOption = { raw: true };
export type TNonRawParserOption = { raw?: false | undefined };
export type TParserOptions<T> =
	| undefined
	| TRawParserOption
	| TNonRawParserOption
	| (TNonRawParserOption &
			(
				| TDefaultParserOptions
				| TCustomParserOptions<T>
				| TCustomxDefaultParserOptions<T>
				| TDefaultxCustomParserOptions<T>
			));

export type TGetParserResult<T> =
	| TRawParser<T>
	| TDefaultParser<T>
	| TCustomParser<T>
	| TDefaultxCustomParser<T>
	| TCustomxDefaultParser<T>;

export type TPostData = (
	| Post
	| Page
	| (PostRevision & { status: 'Trash'; type: undefined })
) & { parent: number };

export type TPreviewContent = {
	isLoading: boolean;
	src: string;
	entityList: TPostData[];
	html: string;
	rootId: number;
	historyPosition: number;
};

export type TPreviewContentReducerAction =
	| { name: 'startNavigation' }
	| { name: 'endNavigation' }
	| { name: 'refreshHTML' }
	| { name: 'initState'; entityList: TPostData[]; html: string; src: string }
	| { name: 'updateLocation'; src: string }
	| { name: 'navigationFailed'; html: string }
	| { name: 'navigateHistory'; src: string; position: number }
	| ({ name: 'locationChanged' } & Omit<
			TPreviewContent,
			'isLoading' | 'html' | 'historyPosition'
	  >)
	| { name: 'entityChanged'; html: string };
