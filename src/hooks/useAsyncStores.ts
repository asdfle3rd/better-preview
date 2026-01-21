import { store as _coreDataStore } from '@wordpress/core-data';
import { store as _editorStore } from '@wordpress/editor';
import { store as _noticesStore } from '@wordpress/notices';
import { store as _preferencesStore } from '@wordpress/preferences';

import { resolveSelect } from '@wordpress/data';
import {
	TCoreDataSelectors,
	TEditorSelectors,
	TNoticesSelectors,
	TPreferencesSelectors,
	Promisify,
} from 'types';

type TWpAsyncStoreReturn = {
	asyncCoreDataStore: Promisify<TCoreDataSelectors>;
	asyncEditorStore: Promisify<TEditorSelectors>;
	asyncNoticesStore: Promisify<TNoticesSelectors>;
	asyncPreferencesStore: Promisify<TPreferencesSelectors>;
};

export const useAsyncStores = (): TWpAsyncStoreReturn => {
	const asyncCoreDataStore = resolveSelect(
		_coreDataStore
	) as Promisify<TCoreDataSelectors>;
	const asyncEditorStore = resolveSelect(
		_editorStore
	) as Promisify<TEditorSelectors>;
	const asyncNoticesStore = resolveSelect(
		_noticesStore
	) as Promisify<TNoticesSelectors>;
	const asyncPreferencesStore = resolveSelect(
		_preferencesStore
	) as Promisify<TPreferencesSelectors>;
	return {
		asyncCoreDataStore,
		asyncEditorStore,
		asyncNoticesStore,
		asyncPreferencesStore,
	};
};
