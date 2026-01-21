import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import {
	getParser,
	handleStorageError,
	resolveHookState,
} from 'hooks/misc/hookUtils';
import { TParserOptions, TContainsWhitespace } from 'types';
import { useLocalStorage } from 'hooks/useLocalStorage';

type TReactSetState<S> = React.Dispatch<React.SetStateAction<S>>;
export type THistoryState<S> = {
	getPosition: () => number;
	capacity: number;
	getHistory: () => S[];
	back: (amount?: number) => void;
	forward: (amount?: number) => void;
	go: (position: number) => void;
	indexOf: (item: S) => number;
};

export type TLocalStorageHistoryStateHelpers<S> = {
	saveHistory: () => S[];
	restoreHistory: () => S[];
};

type TOptionsCore<S> = {
	capacity?: number;
	initialHistory?: [];
	dropItem?: (_: S) => boolean;
	initialPosition?: number;
};

type TOptionsHistory<S> = TOptionsCore<S> & {
	localStorageKey?: TContainsWhitespace;
	parser?: undefined;
};

type TOptionsHistoryLocalStorage<S> = TOptionsCore<S> & {
	localStorageKey: string;
	parser?: TParserOptions<S>;
};

type TUseStateReturn<S> = [
	S | undefined,
	React.Dispatch<React.SetStateAction<S>>,
	THistoryState<S>,
];

type TUseStateReturnLocalStorage<S> = [
	undefined,
	TReactSetState<S>,
	THistoryState<S> & TLocalStorageHistoryStateHelpers<S>,
	TLocalStorageRemoveOp,
];
type TUseStateReturnLocalStorageStateDefined<S> = [
	S,
	TReactSetState<S>,
	THistoryState<S> & TLocalStorageHistoryStateHelpers<S>,
	TLocalStorageRemoveOp,
];

type TLocalStorageRemoveOp = () => void;

export function useStateWithHistory<S>(
	options?: TOptionsHistory<S>,
	initialState?: S | (() => S) | undefined | null
): TUseStateReturn<S>;

export function useStateWithHistory<S>(
	options: TOptionsHistory<S>,
	initialState?: S | (() => S) | undefined | null
): TUseStateReturn<S>;

export function useStateWithHistory<S>(
	options: TOptionsHistoryLocalStorage<S>,
	initialState?: undefined | null
): TUseStateReturnLocalStorage<S>;

export function useStateWithHistory<S>(
	options: TOptionsHistoryLocalStorage<S>,
	initialState: S | (() => S)
): TUseStateReturnLocalStorageStateDefined<S>;

export function useStateWithHistory<S>(
	options?: TOptionsHistory<S> | TOptionsHistoryLocalStorage<S>,
	initialState?: S
):
	| TUseStateReturn<S>
	| TUseStateReturnLocalStorage<S>
	| TUseStateReturnLocalStorageStateDefined<S> {
	const {
		capacity: _capacity = 10,
		initialHistory,
		localStorageKey,
		initialPosition,
		dropItem,
	} = options || ({} as TOptionsHistory<S> | TOptionsHistoryLocalStorage<S>);
	const { serializer, deserializer } = getParser<S[]>();
	if (_capacity < 1) {
		throw new Error(
			`Capacity has to be greater than 1, got '${_capacity}'`
		);
	}

	// Always call both hooks to respect Rules of Hooks
	const handlers = {
		undefined: useState<S>(initialState ?? ({} as S)),
		string: useLocalStorage<S>(
			localStorageKey ?? '--useStateWithHistoryPlaceholder--',
			initialState
		),
	};
	initialState = resolveHookState(initialState);
	const sanitizedlocalStorageKey = localStorageKey?.trim();
	const handlerType = sanitizedlocalStorageKey?.length
		? 'string'
		: 'undefined';

	const [state, _setState, removeOp] =
		localStorageKey === undefined ? handlers.undefined : handlers.string;

	if (handlerType === 'undefined') {
		window.localStorage.removeItem('--useStateWithHistoryPlaceholder--');
	}

	const historyRef = useRef<S[]>(
		(() => {
			const _history = initialHistory ?? ([] as S[]);
			if (_history.length) {
				if (
					initialState !== undefined &&
					_history[_history.length - 1] !== initialState
				) {
					_history.push(initialState);
				}
				if (_history.length > _capacity) {
					return _history.slice(_history.length - _capacity);
				}
			} else if (initialState !== undefined) {
				_history.push(initialState);
			}
			return _history;
		})()
	);

	const indicesRef = useRef<Map<S, number>>(
		new Map(historyRef.current.map((e, i) => [e, i]))
	);

	const historyPosition = useRef<number>(
		(() => {
			if (initialPosition === undefined || initialPosition === null) {
				return historyRef.current?.length
					? historyRef.current.length - 1
					: 0;
			}
			if (
				typeof initialPosition === 'number' &&
				initialPosition >= historyRef.current?.length
			) {
				return historyRef.current?.length
					? historyRef.current.length - 1
					: 0;
			}
			return initialPosition;
		})()
	);

	const historyStatechangeHandler = useCallback(
		(
			currentState: S | undefined,
			newState: S,
			_history: S[],
			_historyPosition: number
		): [S[], number] => {
			if (newState === currentState) {
				return [_history, _historyPosition];
			}
			if (_historyPosition < _history.length - 1) {
				_history = _history.slice(0, _historyPosition + 1);
			}
			_historyPosition = _history.push(newState) - 1;
			if (_history.length > _capacity) {
				const newHistory = _history.slice(_history.length - _capacity);
				_historyPosition = newHistory.length - 1;
				_history = newHistory;
			}
			const uniqueHistory = _history
				.filter((e) => e !== newState)
				.concat([newState]);
			_historyPosition =
				_historyPosition - (_history.length - uniqueHistory.length);
			return [uniqueHistory, _historyPosition];
		},
		[_capacity]
	);

	const setState = useCallback(
		(newState: React.SetStateAction<S>): void => {
			(_setState as React.Dispatch<React.SetStateAction<S | undefined>>)(
				(currentState: S | undefined) => {
					newState = resolveHookState(newState, currentState) as S;
					if (
						typeof dropItem === 'function' &&
						dropItem(newState) === true
					) {
						return currentState;
					}
					[historyRef.current, historyPosition.current] =
						historyStatechangeHandler(
							currentState,
							newState,
							historyRef.current,
							historyPosition.current
						);
					indicesRef.current = new Map(
						historyRef.current.map((e, i) => [e, i])
					);
					return newState;
				}
			);
		},
		[_setState, dropItem, historyStatechangeHandler]
	) as React.Dispatch<React.SetStateAction<S>>;

	const historyState = useMemo(
		(): THistoryState<S> => ({
			getHistory: () => historyRef?.current ?? [],
			getPosition: () => historyPosition.current,
			capacity: _capacity,
			indexOf: (item: S) => indicesRef.current.get(item) ?? -1,
			back: (amount: number = 1) => {
				if (!historyPosition.current) {
					return;
				}
				_setState(() => {
					historyPosition.current -= Math.min(
						amount,
						historyPosition.current
					);
					return historyRef.current[historyPosition.current];
				});
			},
			forward: (amount: number = 1) => {
				if (historyPosition.current === historyRef.current.length - 1) {
					return;
				}

				_setState(() => {
					historyPosition.current = Math.min(
						historyPosition.current + amount,
						historyRef.current.length - 1
					);

					return historyRef.current[historyPosition.current];
				});
			},
			go: (position: number) => {
				if (position === historyPosition.current) {
					return;
				}
				_setState(() => {
					historyPosition.current =
						position < 0
							? Math.max(historyRef.current.length + position, 0)
							: Math.min(historyRef.current.length - 1, position);
					return historyRef.current[historyPosition.current];
				});
			},
		}),
		[_capacity, _setState]
	);
	const localStorageEnabled = options?.localStorageKey?.length;
	const histkey = localStorageKey + '-history';
	const localStorageHelpers = useMemo(
		(): TLocalStorageHistoryStateHelpers<S> => ({
			saveHistory: () => {
				try {
					window.localStorage.setItem(
						histkey,
						serializer(historyRef.current)
					);
				} catch (error) {
					handleStorageError(error, histkey, 'write');
					return historyRef.current;
				}
				return historyRef.current;
			},
			restoreHistory: () => {
				try {
					const seralized = window.localStorage.getItem(histkey);
					if (!seralized) {
						throw `Key ${histkey} not found in localstorage`;
					}
					historyRef.current = deserializer(seralized);
					indicesRef.current = new Map(
						historyRef.current.map((e, i) => [e, i])
					);
					return historyRef.current;
				} catch (error) {
					handleStorageError(error, histkey, 'read');
					return historyRef.current;
				}
			},
		}),
		[deserializer, histkey, serializer]
	);

	const history = useMemo(
		():
			| THistoryState<S>
			| (THistoryState<S> & TLocalStorageHistoryStateHelpers<S>) =>
			!localStorageEnabled
				? historyState
				: { ...historyState, ...localStorageHelpers },
		[historyState, localStorageEnabled, localStorageHelpers]
	);

	const hookResult = useMemo(
		() =>
			[
				state,
				setState,
				history as THistoryState<S>,
			] as TUseStateReturn<S>,
		[state, setState, history]
	);

	const hookResultLocalStorage = useMemo(() => {
		if (initialState === undefined) {
			return [
				state,
				setState,
				history as THistoryState<S> &
					TLocalStorageHistoryStateHelpers<S>,
				removeOp,
			] as TUseStateReturnLocalStorage<S>;
		}
		return [
			state,
			setState,
			history as THistoryState<S> & TLocalStorageHistoryStateHelpers<S>,
			removeOp,
		] as TUseStateReturnLocalStorageStateDefined<S>;
	}, [initialState, state, setState, history, removeOp]);

	return !localStorageEnabled ? hookResult : hookResultLocalStorage;
}
