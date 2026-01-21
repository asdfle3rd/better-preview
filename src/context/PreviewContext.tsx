import React, {
	createContext,
	useContext,
	useRef,
	useState,
	useCallback,
	ReactNode,
} from 'react';
import {
	TPostData,
	TPreviewContent,
	TPreviewContentReducerAction,
} from 'types';
import { THistoryState } from 'hooks/useStateWithHistory';
import { usePreviewContent } from 'hooks/usePreviewContent';
import { usePreviewState } from 'hooks/usePreviewState';
import useLocalStorage from 'hooks/useLocalStorage';
import useIsMobile from 'hooks/useIsMobile';

export type PreviewContextType = {
	SidebarPrefix: string;
	SidebarName: string;
	SidebarID: string;
	activeGeneralSidebarName: string | null;
	storedSrc: string;
	setStoredSrc: React.Dispatch<React.SetStateAction<string>>;
	iframeRef: React.RefObject<HTMLIFrameElement | null>;
	areOverlaysVisible: boolean;
	setAreOverlaysVisible: (visible: boolean) => void;
	isHeaderPinned: boolean;
	setIsHeaderPinned: (pinned: boolean) => void;
	isHeaderVisible: boolean;
	setIsHeaderVisible: (visible: boolean) => void;
	previewActive: boolean;
	setPreviewActive: React.Dispatch<React.SetStateAction<boolean>>;
	previewKeypress: (e: KeyboardEvent) => void;
	postData: TPostData;
	matcher: { [key: string]: boolean } | undefined;
	entityIdx: number;
	currentEntity?: TPostData;
	isCurrentEntityRoot: boolean;
	prevEntityIdx: number;
	nextEntityIdx: number;
	setEntityIdx: React.Dispatch<React.SetStateAction<number>>;
	statusFilters: string[];
	setStatusFilters: React.Dispatch<React.SetStateAction<string[]>>;
	locationHistory: THistoryState<string>;
	previewContent: TPreviewContent;
	dispatch: React.Dispatch<TPreviewContentReducerAction>;
	isMobile: boolean | undefined;
};

export const PreviewContext = createContext<PreviewContextType | undefined>(
	undefined
);

export const usePreviewContext = () => {
	const context = useContext(PreviewContext);
	if (!context) {
		throw new Error(
			'usePreviewContext must be used within a PreviewProvider'
		);
	}
	return context;
};

type PreviewProviderProps = {
	children: ReactNode;
};

export const PreviewProvider = ({ children }: PreviewProviderProps) => {
	const SidebarPrefix = 'better-preview-plugin';
	const SidebarName = 'my-plugin-sidebar';
	const SidebarID = `${SidebarPrefix}/${SidebarName}`;

	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [areOverlaysVisible, setAreOverlaysVisible] =
		useLocalStorage<boolean>('preview-overlays-visible', true);
	const [isHeaderPinned, setIsHeaderPinned] = useLocalStorage<boolean>(
		'preview-header-pinned',
		false
	);
	const [previewActive, setPreviewActive] = useLocalStorage<boolean>(
		'previewActive',
		false
	);

	const previewKeypress = useCallback(
		(e: KeyboardEvent) => {
			if (
				e.altKey ||
				e.shiftKey ||
				e.ctrlKey ||
				(e.target as HTMLElement).contentEditable === 'true'
			) {
				return;
			}
			if (e.key === 'k') {
				setPreviewActive((state) => !state);
			}
			if (previewActive && e.key === 'Escape') {
				setPreviewActive(false);
			}
		},
		[setPreviewActive, previewActive]
	);
	const [isHeaderVisible, setIsHeaderVisible] = useState(false);
	const { activeGeneralSidebarName } = usePreviewState(
		previewActive,
		setPreviewActive,
		previewKeypress,
		SidebarID,
		SidebarPrefix,
		SidebarName
	);
	const {
		storedSrc,
		setStoredSrc,
		postData,
		entityIdx,
		matcher,
		currentEntity,
		isCurrentEntityRoot,
		prevEntityIdx,
		nextEntityIdx,
		setEntityIdx,
		statusFilters,
		setStatusFilters,
		locationHistory,
		previewContent,
		dispatch,
	} = usePreviewContent(previewActive, iframeRef, previewKeypress);

	const isMobile = useIsMobile();

	const contextValue: PreviewContextType = {
		SidebarPrefix,
		SidebarName,
		SidebarID,
		activeGeneralSidebarName,
		storedSrc,
		setStoredSrc,
		iframeRef,
		areOverlaysVisible: areOverlaysVisible ?? true,
		setAreOverlaysVisible,
		isHeaderPinned: isHeaderPinned ?? false,
		setIsHeaderPinned,
		isHeaderVisible,
		setIsHeaderVisible,
		previewActive,
		setPreviewActive,
		previewKeypress,
		postData,
		matcher,
		entityIdx,
		currentEntity,
		isCurrentEntityRoot,
		prevEntityIdx,
		nextEntityIdx,
		setEntityIdx,
		statusFilters,
		setStatusFilters,
		locationHistory,
		previewContent,
		dispatch,
		isMobile,
	};

	return (
		<PreviewContext.Provider value={contextValue}>
			{children}
		</PreviewContext.Provider>
	);
};
