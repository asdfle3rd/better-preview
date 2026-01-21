import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

type HistoryBackButtonProps = {
	onClick: () => void;
};

const HistoryBackButton = ({ onClick }: HistoryBackButtonProps) => (
	<Button
		icon="arrow-left"
		onClick={onClick}
		label={__('Go back', 'better-preview-plugin')}
	/>
);

export default HistoryBackButton;
