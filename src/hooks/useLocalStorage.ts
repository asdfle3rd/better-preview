import { useCallback, useState, useEffect, useMemo } from '@wordpress/element';
import {
	handleStorageError,
	isBrowser,
	resolveHookState,
	getParser,
	isStrict,
	preventWhitespace,
} from 'hooks/misc/hookUtils';
import { TParserOptions } from 'types';

// --- Main implementation ---
/**
 * A memoized hook for localStorage.
 *
 * @param key          The localStorage key.
 * @param initialValue The default value if none is found.
 * @param options      (Optional) Parser options for serialization/deserialization.
 */
export function useLocalStorage<T>(
	key: string,
	initialValue: T,
	options?: TParserOptions<T>
): [T, React.Dispatch<React.SetStateAction<T>>, () => void];
export function useLocalStorage<T>(
	key: string,
	initialValue?: T,
	options?: TParserOptions<T>
): [
	T | undefined,
	React.Dispatch<React.SetStateAction<T | undefined>>,
	() => void,
];
export function useLocalStorage<T>(
	key: string,
	initialValue?: T,
	options?: TParserOptions<T>
): [
	T | undefined,
	React.Dispatch<React.SetStateAction<T | undefined>>,
	() => void,
] {
	// --- Memoized Serializers/Deserializers ---
	const { serializer, deserializer } = useMemo(
		() => getParser<T>(options),
		[options]
	);
	// --- Encapsulated Read Logic ---
	// This function is memoized and serves as the single source of truth for reading.
	const readValue = useCallback((): T | undefined => {
		// SSR fallback
		if (!isBrowser) {
			return;
		}

		try {
			const item = localStorage.getItem(key);
			if (!!item) {
				return deserializer(item);
			}
		} catch (error) {
			handleStorageError(error, key, 'read');
		}

		// Item not found or error, set initial value in storage
		if (initialValue !== undefined) {
			try {
				localStorage.setItem(key, serializer(initialValue));
				return initialValue;
			} catch (error) {
				handleStorageError(error, key, 'write');
			}
		}
		return undefined;
	}, [initialValue, key, deserializer, serializer]);

	// --- State Initialization ---
	// We read the value once on initialization
	const [state, setState] = useState<T | undefined>(readValue);

	// --- State Setter ---
	const set: React.Dispatch<React.SetStateAction<T | undefined>> =
		useCallback(
			(arg) => {
				if (!isBrowser) {
					return undefined;
				}
				try {
					// Use functional update to get the latest state
					setState((currentState) => {
						arg = resolveHookState(arg, currentState);
						// If new state is undefined, remove it from storage
						if (arg === undefined) {
							// Storage may have been cleared already by calling the remove helper
							if (!!localStorage.getItem(key)) {
								localStorage.removeItem(key);
							}
							return undefined;
						}

						// Otherwise, serialize and set it
						const valueToStore = serializer(arg);
						localStorage.setItem(key, valueToStore);

						return arg;
					});
				} catch (error) {
					handleStorageError(error, key, 'write');
				}
			},
			[key, serializer]
		);

	// --- Remove Functoion ---
	const remove = useCallback(() => {
		if (!isBrowser) {
			return undefined;
		}

		try {
			localStorage.removeItem(key);
			setState(undefined);
		} catch (error) {
			handleStorageError(error, key, 'remove');
		}
	}, [key]);

	// --- Effect for Cross-Tab Sync ---
	useEffect(() => {
		if (!isBrowser) {
			return;
		}

		const handleStorageChange = (event: StorageEvent) => {
			if (event.key === key) {
				if (event.newValue === null) {
					// Key was removed
					setState(undefined);
				} else {
					// Key was added/changed
					try {
						setState(deserializer(event.newValue));
					} catch (error) {
						console.warn(
							`Error deserializing storage change:`,
							error
						);
						// Fallback to re-reading
						setState(readValue());
					}
				}
			}
		};

		window.addEventListener('storage', handleStorageChange);
		return () => {
			window.removeEventListener('storage', handleStorageChange);
		};
	}, [key, deserializer, readValue]);
	// Ensure all hook have run before handling errors
	if (!key) {
		const msg = 'useLocalStorage key may not be falsy';
		if (isStrict) {
			throw new Error(msg);
		}
		console.error(msg);
	}
	// Type Guard for storage keys
	preventWhitespace(key, 'storagekey may not contain whitespace');
	return [state, set, remove];
}

export default useLocalStorage;
