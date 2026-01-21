import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import styles from './ClosePreviewButton.modules.scss';
import { usePreviewContext } from 'context/PreviewContext';

type ClosePreviewButtonProps = {
	isMobile?: boolean;
};

const ClosePreviewButton = ({ isMobile }: ClosePreviewButtonProps) => {
	const { setPreviewActive } = usePreviewContext();
	const label = __('Close preview', 'better-preview-plugin');

	return (
		<Button
			icon={!isMobile ? 'fullscreen-exit-alt' : undefined}
			className={`${styles.closeButton} ${isMobile ? styles.mobile : ''}`}
			onClick={(e: React.MouseEvent) => {
				e.stopPropagation();
				setPreviewActive(false);
			}}
			label={label}
		>
			{isMobile && label}
		</Button>
	);
};

export default ClosePreviewButton;
