import {
	TCustomDeserializer,
	TCustomParser,
	TCustomSerializer,
	TCustomxDefaultParser,
	TDefaultParser,
	TDefaultxCustomParser,
	TGetParserResult,
	TNonRawParserOption,
	TParserOptions,
	TRawParser,
	TRawParserOption,
	TSetStateFunctionNoArg,
	TSetStateFunctionWithArg,
	TStorageOperation,
	TPostData,
} from 'types';

export const isBrowser = typeof window !== 'undefined';
export const isFunction = (f: unknown) => typeof f === 'function';
export const invokeSafe = (f: unknown) => {
	if (isFunction(f)) {
		f();
	}
};

export const isStrict = (function (this: unknown) {
	return !this;
})();

export const preventWhitespace = (
	str: string,
	msg = 'String contains whitespace'
) => {
	if (/\s/.test(str)) {
		if (isStrict) {
			throw new Error(msg);
		}
		console.warn(msg);
	}
};

/**
 * Custom error handler for localStorage operations.
 * @param error
 * @param key
 * @param operation
 */
export const handleStorageError = (
	error: unknown,
	key: string,
	operation: TStorageOperation
) => {
	if (
		error instanceof DOMException &&
		(error.name === 'QuotaExceededError' ||
			error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
	) {
		console.warn(
			`localStorage quota exceeded for key “${key}” during ${operation}.`
		);
	} else {
		console.warn(`Error ${operation}ing localStorage key “${key}”:`, error);
	}
};

export function getParser<T>(options?: undefined): TDefaultParser<T>;
export function getParser<T>(options: TRawParserOption): TRawParser<T>;
export function getParser<T>(options: TNonRawParserOption): TDefaultParser<T>;
export function getParser<T>(
	options: TNonRawParserOption & TCustomParser<T>
): TCustomParser<T>;
export function getParser<T>(
	options: TNonRawParserOption & TCustomxDefaultParser<T>
): TCustomxDefaultParser<T>;
export function getParser<T>(
	options: TNonRawParserOption & TDefaultxCustomParser<T>
): TDefaultxCustomParser<T>;
export function getParser<T>(options?: TParserOptions<T>): TGetParserResult<T>;
export function getParser<T>(
	options?: undefined | TParserOptions<T>
): TGetParserResult<T> {
	const raw = options?.raw ?? false;
	const serializerFn = (options as { serializer: TCustomSerializer<T> })
		?.serializer;
	const deserializerFn = (options as { deserializer: TCustomDeserializer<T> })
		?.deserializer;

	return {
		serializer: raw ? String : (serializerFn ?? JSON.stringify),
		deserializer: raw
			? (value: string) => value as T // User asked for raw, so we trust them
			: (deserializerFn ?? JSON.parse),
	};
}

/**
 * Resolves the input of a SetState dispatcher to a concrete value.
 * @param nextState The state to set for the next render
 * @param prevState The state set during the current render
 * @return The resolved value
 */
export function resolveHookState<S, C extends S>(
	nextState: React.SetStateAction<S>,
	prevState: C | undefined = undefined
): S {
	// evaluate passed function or leave new input value as is
	if (typeof nextState !== 'function') {
		return nextState;
	}
	return prevState !== undefined
		? (nextState as TSetStateFunctionWithArg<C>)(prevState)
		: (nextState as TSetStateFunctionNoArg<C>)();
}

export const searchItem = (
	entityList: TPostData[],
	startIdx: number,
	matcher: { [key: string]: boolean },
	direction: -1 | 1
): number => {
	let i = startIdx;
	while (i >= 0 && i < entityList.length) {
		if (matcher[entityList[i].status]) {
			return i;
		}
		i += direction;
	}
	return NaN;
};
