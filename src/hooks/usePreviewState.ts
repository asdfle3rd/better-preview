import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import useLocalStorage from 'hooks/useLocalStorage';
import { useUIReadyState } from 'hooks/useUIReadyState';

type TCoreInterfaceStore = (store: 'core/interface') => {
	getActiveComplementaryArea: (name: string) => string | null;
};

export const usePreviewState = (
	previewActive: boolean,
	setPreviewActive: (active: boolean | ((prev: boolean) => boolean)) => void,
	previewKeypress: (e: KeyboardEvent) => void,
	SidebarID: string,
	SidebarPrefix: string,
	SidebarName: string
) => {
	const { isInitialized, editorRef, pluginButtonRef } = useUIReadyState(
		SidebarPrefix,
		SidebarName
	);

	useEffect(() => {
		if (isInitialized && pluginButtonRef.current) {
			const btn = pluginButtonRef.current;
			const handler = (e: Event) => {
				e.preventDefault();
				e.stopPropagation();
				setPreviewActive(true);
			};
			btn.addEventListener('click', handler);
			return () => {
				btn.removeEventListener('click', handler);
			};
		}
	}, [isInitialized, pluginButtonRef, setPreviewActive]);

	const { enableComplementaryArea, disableComplementaryArea } =
		useDispatch('core/interface');

	const [prevActiveSidebar, setPrevSidebarState] = useLocalStorage<
		string | null
	>('prevActiveSidebar');

	const { activeGeneralSidebarName } = useSelect(
		(select: TCoreInterfaceStore) => {
			return {
				activeGeneralSidebarName:
					select('core/interface').getActiveComplementaryArea('core'),
			};
		},
		[]
	);

	// Track previous sidebar state to restore it when closing preview
	useEffect(() => {
		if (activeGeneralSidebarName !== SidebarID) {
			setPrevSidebarState(activeGeneralSidebarName ?? '');
		}
	}, [SidebarID, activeGeneralSidebarName, setPrevSidebarState]);
	useEffect(() => {
		if (prevActiveSidebar?.length && !previewActive) {
			enableComplementaryArea('core', prevActiveSidebar);
		}
	}, [
		enableComplementaryArea,
		previewActive,
		prevActiveSidebar,
		disableComplementaryArea,
		SidebarID,
	]);

	// Key event listeners
	useEffect(() => {
		window.addEventListener('keyup', previewKeypress);
		if (editorRef.current) {
			editorRef.current.contentWindow?.addEventListener(
				'keyup',
				previewKeypress
			);
		}
		const refCopy = editorRef.current;
		return () => {
			refCopy?.contentWindow?.removeEventListener(
				'keyup',
				previewKeypress
			);
			window.removeEventListener('keyup', previewKeypress);
		};
	}, [previewKeypress, isInitialized, editorRef]);

	return {
		activeGeneralSidebarName,
	};
};
