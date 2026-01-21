import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { pin } from '@wordpress/icons';
import { usePreviewContext } from 'context/PreviewContext';
import styles from './PinButton.modules.scss';

const PinButton = () => {
	const { isHeaderPinned, setIsHeaderPinned } = usePreviewContext();

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsHeaderPinned(!isHeaderPinned);
	};

	return (
		<Button
			icon={pin}
			onClick={handleClick}
			label={
				isHeaderPinned
					? __('Unpin Header', 'better-preview-plugin')
					: __('Pin Header', 'better-preview-plugin')
			}
			className={`${styles.pinButton} ${isHeaderPinned ? styles.active : ''}`}
			isPressed={isHeaderPinned}
		/>
	);
};

export default PinButton;
