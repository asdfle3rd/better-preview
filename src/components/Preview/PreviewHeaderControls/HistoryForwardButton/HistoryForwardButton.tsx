import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

type HistoryForwardButtonProps = {
	onClick: () => void;
};

const HistoryForwardButton = ({ onClick }: HistoryForwardButtonProps) => (
	<Button
		icon="arrow-right"
		onClick={onClick}
		label={__('Go forward', 'better-preview-plugin')}
	/>
);

export default HistoryForwardButton;
