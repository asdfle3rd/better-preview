import {
	useState,
	useEffect,
	useReducer,
	useCallback,
	useMemo,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useStateWithHistory } from 'hooks/useStateWithHistory';
import {
	TSetStateAction,
	TPreviewContent,
	TPreviewContentReducerAction,
	TPostData,
} from 'types';
import { useCustomApi } from 'hooks/useCustomApi';
import { useAsyncStores } from 'hooks/useAsyncStores';
import { resolveHookState, searchItem } from 'hooks/misc/hookUtils';
import { useToast } from 'components/Toast/ToastProvider';
import useLocalStorage from './useLocalStorage';

export const usePreviewContent = (
	previewActive: boolean,
	iframeRef: React.RefObject<HTMLIFrameElement | null>,
	previewKeypress: (e: KeyboardEvent) => void
) => {
	// === Data ===
	const { addToast } = useToast();
	const [postData, setPostData] = useState<TPostData>({} as TPostData);
	const [storedSrc, setStoredSrc, locationHistory] =
		useStateWithHistory<string>(
			{
				localStorageKey: 'preview-location',
				capacity: 100,
				dropItem: useCallback(
					(item: string) =>
						!item.length ||
						!item.startsWith(window.location.origin),
					[]
				),
			},
			''
		);
	const [entityIdx, _setEntityIdx] = useState<number>(0);
	const [statusFilters, setStatusFilters] = useLocalStorage<string[]>(
		'preview-status-filters',
		[]
	);

	const { asyncEditorStore } = useAsyncStores();
	const { getPostByUrl, getIframeContent, getEntityList, getErrorPage } =
		useCustomApi();

	const reducer = (
		state: TPreviewContent,
		action: TPreviewContentReducerAction
	): TPreviewContent => {
		if (action.name === 'startNavigation') {
			return {
				...state,
				isLoading: true,
			};
		}
		if (action.name === 'endNavigation') {
			return {
				...state,
				isLoading: false,
			};
		}
		if (action.name === 'refreshHTML') {
			return {
				...state,
				html: ` ${state.html} `,
			};
		}
		if (action.name === 'updateLocation') {
			return {
				...state,
				src: action.src,
			};
		}
		if (action.name === 'navigationFailed') {
			return {
				...state,
				html: action.html,
			};
		}
		if (action.name === 'navigateHistory') {
			return {
				...state,
				src: action.src,
				historyPosition: action.position,
			};
		}
		if (action.name === 'locationChanged') {
			return {
				...state,
				entityList: action.entityList,
				src: action.src ?? state.src,
				rootId: action.rootId,
			};
		}
		if (action.name === 'entityChanged') {
			return {
				...state,
				html: action.html,
			};
		}
		throw new Error(`Undefined action ${JSON.stringify(action)} called`);
	};
	const initialState: TPreviewContent = {
		isLoading: true,
		entityList: [],
		html: '',
		src: storedSrc ?? '',
		rootId: NaN,
		historyPosition: NaN,
	};
	const [state, dispatch] = useReducer(reducer, initialState);

	const matcher = useMemo(
		() =>
			statusFilters.length > 0
				? statusFilters.reduce(
						(acc: { [key: string]: boolean }, f: string) => ({
							...acc,
							[f]: true,
						}),
						{}
					)
				: undefined,
		[statusFilters]
	);

	const { prevEntityIdx, nextEntityIdx } = useMemo(() => {
		const entityList = state.entityList;
		if (matcher === undefined) {
			return {
				prevEntityIdx: entityIdx - 1 < 0 ? NaN : entityIdx - 1,

				nextEntityIdx:
					entityIdx + 1 >= entityList.length ? NaN : entityIdx + 1,
			};
		}

		return {
			prevEntityIdx: searchItem(entityList, entityIdx - 1, matcher, -1),

			nextEntityIdx: searchItem(entityList, entityIdx + 1, matcher, 1),
		};
	}, [state.entityList, matcher, entityIdx]);

	const currentEntity = state.entityList[entityIdx];
	const isCurrentEntityRoot = currentEntity?.id === state.rootId;

	// === Callbacks ===
	const setEntityIdx = useCallback(
		(actionOrVal: TSetStateAction<number>) => {
			_setEntityIdx((prev) => {
				const i = resolveHookState(actionOrVal, prev);
				if (!state.entityList.length || i < 0) {
					return 0;
				}
				if (i < state.entityList.length) {
					return i;
				}
				return state.entityList.length;
			});
		},
		[state.entityList.length]
	);

	const handleLocationChange = useCallback(
		async (src: string) => {
			const { id, type } = await getPostByUrl(src);
			console.log(id, type);
			if (id === undefined || type === undefined) {
				dispatch({
					name: 'navigationFailed',
					html: getErrorPage(`No ID found for ${src}.`),
				});
				return;
			}
			if (id === -1) {
				dispatch({
					name: 'locationChanged',
					entityList: [
						{ id: -1, type: 'unknown' } as unknown as TPostData,
					],
					src,
					rootId: -1,
				});
				_setEntityIdx(0);
				setStoredSrc(src);
				return;
			}
			const [rawEntityList, err] = await getEntityList(id, type);
			if (err !== undefined || !rawEntityList?.length) {
				dispatch({
					name: 'navigationFailed',
					html: getErrorPage('Failed to fetch Posts/Pages'),
				});
				return;
			}

			let _rootId = id;
			rawEntityList.sort((a, b) => {
				if (a.parent === 0) {
					_rootId = a.id;
					return 1;
				}
				return (
					new Date(a.modified).getTime() -
					new Date(b.modified).getTime()
				);
			});

			let itemIdx = rawEntityList.length - 1;
			if (
				matcher !== undefined &&
				Object.values(matcher ?? {}).length > 0
			) {
				itemIdx = searchItem(rawEntityList, itemIdx, matcher, -1);
			}

			_setEntityIdx(itemIdx);
			setStoredSrc(src);
			dispatch({
				name: 'locationChanged',
				entityList: rawEntityList,
				src,
				rootId: _rootId,
			});
		},
		[getEntityList, getErrorPage, getPostByUrl, matcher, setStoredSrc]
	);

	const handleEntityChange = useCallback(
		async (_entityIdx: number) => {
			const len = state?.entityList?.length;
			if (!len || entityIdx >= len || entityIdx < 0 || isNaN(entityIdx)) {
				return;
			}
			try {
				const [_html, errHtml] = await getIframeContent(
					state.entityList[_entityIdx].id
				);
				if (errHtml !== undefined) {
					addToast(
						__('Failed to fetch content', 'better-preview-plugin'),
						'error'
					);
					addToast(JSON.stringify(errHtml).slice(0, 100), 'error');
					return;
				}
				dispatch({
					name: 'entityChanged',
					html: _html,
				});
			} finally {
				setTimeout(() => dispatch({ name: 'endNavigation' }), 120);
			}
		},
		[addToast, entityIdx, getIframeContent, state.entityList]
	);
	const handleInit = useCallback(async () => {
		if (state.src?.length) {
			return;
		}
		const _src = await asyncEditorStore.getPermalink();
		dispatch({
			name: 'updateLocation',
			src: _src ?? window.location.origin,
		});
	}, [asyncEditorStore, state.src?.length]);

	// === Effects ===
	useEffect(() => {
		if (previewActive) {
			handleInit();
		}
	}, [handleInit, previewActive]);

	useEffect(() => {
		if (!iframeRef?.current || !previewActive) {
			return;
		}
		iframeRef.current.srcdoc = state.html;
		const iframeRefCopy = iframeRef;
		setTimeout(() => {
			if (iframeRef?.current) {
				iframeRef.current.contentDocument?.addEventListener(
					'keyup',
					previewKeypress
				);
			}
			dispatch({ name: 'endNavigation' });
		}, 120);
		return () => {
			iframeRefCopy.current?.contentDocument?.removeEventListener(
				'keyup',
				previewKeypress
			);
		};
	}, [iframeRef, previewActive, previewKeypress, state.html]);

	useEffect(() => {
		handleLocationChange(state.src);
	}, [handleLocationChange, state.src]);

	useEffect(() => {
		dispatch({ name: 'startNavigation' });
		handleEntityChange(entityIdx);
	}, [entityIdx, handleEntityChange]);

	useEffect(() => {
		locationHistory.go(state.historyPosition);
	}, [locationHistory, state.historyPosition]);

	return {
		currentEntity,
		isCurrentEntityRoot,
		storedSrc,
		setStoredSrc,
		postData,
		setPostData,
		matcher,
		entityIdx,
		prevEntityIdx,
		nextEntityIdx,
		setEntityIdx,
		statusFilters,
		setStatusFilters,
		locationHistory,
		previewContent: state,
		dispatch,
	};
};
