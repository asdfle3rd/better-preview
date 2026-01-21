import { useCallback, forwardRef } from '@wordpress/element';
import styles from './PreviewIframe.modules.scss';
import { useMemo } from 'react';

type WindowEventListeners = {
	[K in keyof WindowEventMap]?: (event: WindowEventMap[K]) => void;
};

type PreviewIframeProps = {
	wrapperStyle?: React.CSSProperties;
	iframeStyle?: React.CSSProperties;
	onLocationChange?: (href: string) => void;
	onNavigationEnd?: (
		event: React.SyntheticEvent<HTMLIFrameElement, Event>
	) => void;
	beforeUnload?: (beforeUnloadEvent: BeforeUnloadEvent) => void;
	handlers: WindowEventListeners;
};

const PreviewIframe = forwardRef<HTMLIFrameElement, PreviewIframeProps>(
	(
		{
			iframeStyle,
			wrapperStyle,
			onNavigationEnd,
			onLocationChange: onLocationUpdate,
			beforeUnload,
			handlers,
		},
		ref
	) => {
		const _onNavigationEnd = useCallback(
			(event: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
				if (typeof onNavigationEnd === 'function') {
					onNavigationEnd(event);
				}
			},
			[onNavigationEnd]
		);

		const _beforeUnload = useCallback(
			(event: BeforeUnloadEvent) => {
				if (typeof beforeUnload === 'function') {
					beforeUnload(event);
				}
			},
			[beforeUnload]
		);

		const _handleLoad = useCallback(
			(event: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
				const iframe = event.currentTarget as HTMLIFrameElement;
				const href = iframe?.contentWindow?.location.href;
				const keys = Object.keys(handlers) as (keyof WindowEventMap)[];
				keys.forEach((key) => {
					const handler = handlers[key] as EventListener;
					if (typeof handler === 'function') {
						window.addEventListener(key, handler);
					}
				});
				if (href?.startsWith(window.location.origin)) {
					if (typeof onLocationUpdate === 'function') {
						onLocationUpdate(href);
					}
					return;
				}
				iframe?.contentWindow?.addEventListener(
					'beforeunload',
					_beforeUnload
				);
				_onNavigationEnd(event);
			},
			[_beforeUnload, handlers, _onNavigationEnd, onLocationUpdate]
		);

		const computedWrapperStyle: React.CSSProperties = useMemo(
			() => ({
				...wrapperStyle,
				height: '100%',
				width: '100%',
			}),
			[wrapperStyle]
		);

		return (
			<div style={computedWrapperStyle}>
				<iframe
					ref={ref}
					onLoad={_handleLoad}
					title={'srcdoc-container'}
					sandbox="allow-scripts allow-same-origin"
					className={styles.iframe}
					style={iframeStyle}
				/>
			</div>
		);
	}
);

export default PreviewIframe;
