import { Button, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import styles from './ToggleControlsButton.modules.scss';
import { usePreviewContext } from 'context/PreviewContext';

type ToggleControlsButtonProps = {
	isMobile?: boolean;
};

const ToggleControlsButton = ({ isMobile }: ToggleControlsButtonProps) => {
	const { areOverlaysVisible, setAreOverlaysVisible } = usePreviewContext();
	const label = areOverlaysVisible
		? __('Hide controls', 'better-preview-plugin')
		: __('Show controls', 'better-preview-plugin');

	let icon: React.ComponentProps<typeof Icon>['icon'];
	if (!isMobile) {
		icon = areOverlaysVisible ? 'hidden' : 'visibility';
	}

	return (
		<Button
			icon={icon}
			onClick={(e: React.MouseEvent) => {
				e.stopPropagation();
				setAreOverlaysVisible(!areOverlaysVisible);
			}}
			label={label}
			className={`${styles.toggleButton} ${isMobile ? styles.mobile : ''}`}
		>
			{isMobile && label}
		</Button>
	);
};

export default ToggleControlsButton;
