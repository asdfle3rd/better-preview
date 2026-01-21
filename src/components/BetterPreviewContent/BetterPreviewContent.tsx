import { PluginSidebar } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import PreviewModal from 'components/Preview/PreviewModal/PreviewModal';
import PreviewControls from 'components/Preview/PreviewControls/PreviewControls';
import PreviewIframe from 'components/Preview/PreviewIframe/PreviewIframe';
import { usePreviewContext } from 'context/PreviewContext';
import { Spinner } from '@wordpress/components';
import styles from './BetterPreviewContent.modules.scss';
import { useMemo, useRef } from 'react';
import { useToast } from 'components/Toast/ToastProvider';

const BetterPreviewContent = () => {
	const {
		isHeaderPinned,
		SidebarName,
		dispatch,
		previewContent,
		previewKeypress,
		iframeRef,
	} = usePreviewContext();

	const { addToast } = useToast();
	const startTime = useRef<number>(0);

	const computedWrapperStyle: React.CSSProperties = useMemo(
		() => ({
			paddingTop: isHeaderPinned ? 'clamp(50px, 7vh, 200px)' : '0px',
			transition:
				'padding-top 400ms cubic-bezier(0.215, 0.610, 0.355, 1)',
		}),
		[isHeaderPinned]
	);

	return (
		<>
			<PluginSidebar
				name={SidebarName}
				title={__('BetterPreview', 'preview-plugin-title')}
				icon="fullscreen-alt"
				key={SidebarName}
			/>

			<PreviewModal>
				<PreviewControls />
				<div className={styles.wrapper} style={computedWrapperStyle}>
					<div
						className={`${styles.loader} ${previewContent.isLoading ? styles.isLoading : ''}`}
					>
						<Spinner />
					</div>
					<PreviewIframe
						ref={iframeRef}
						beforeUnload={() => {
							startTime.current = Date.now();
							dispatch({ name: 'startNavigation' });
						}}
						onLocationChange={(href: string) => {
							if (previewContent.src === href) {
								dispatch({ name: 'refreshHTML' });
								return;
							}
							const duration = Date.now() - startTime.current;
							startTime.current = 0; // Reset
							addToast(
								`Time to Interactive: ${duration}ms`,
								'success'
							);
							dispatch({ name: 'updateLocation', src: href });
						}}
						onNavigationEnd={() => {
							if (previewContent.isLoading) {
								dispatch({ name: 'endNavigation' });
							}
						}}
						handlers={{
							keyup: previewKeypress,
						}}
					/>
				</div>
			</PreviewModal>
		</>
	);
};

export default BetterPreviewContent;
