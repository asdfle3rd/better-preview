import { store as coreDataStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import type { CurriedSelectorsOf } from '@wordpress/data/build-types/types';

export type TCoreDataSelectors = CurriedSelectorsOf<typeof coreDataStore>;
export type TEditorSelectors = CurriedSelectorsOf<typeof editorStore>;
export type TNoticesSelectors = CurriedSelectorsOf<typeof noticesStore>;
export type TPreferencesSelectors = CurriedSelectorsOf<typeof preferencesStore>;
