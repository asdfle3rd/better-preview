import { Icon, Button } from '@wordpress/components';
import styles from './HistoryNavButton.modules.scss';

type HistoryNavButtonProps = {
	icon: React.ComponentProps<typeof Icon>['icon'];
	label: string;
	onClick: () => void;
};

const HistoryNavButton = ({ icon, label, onClick }: HistoryNavButtonProps) => (
	<Button
		icon={icon}
		onClick={(e: React.MouseEvent) => {
			e.stopPropagation();
			onClick();
		}}
		label={label}
		className={styles.historyButton}
	/>
);

export default HistoryNavButton;
