import { useRef } from '@wordpress/element';
import { Icon } from '@wordpress/components';
import styles from './SideRevealButton.modules.scss';

type SideRevealButtonProps = {
	onClick: () => void;
	direction: 'left' | 'right';
	icon: React.ComponentProps<typeof Icon>['icon'];
	label: string;
	isMobile?: boolean;
};

const SideRevealButton = ({
	onClick,
	direction,
	icon,
	label,
	isMobile = false,
}: SideRevealButtonProps) => {
	const touchStartXRef = useRef(0);

	const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
		touchStartXRef.current = e.touches[0].clientX;
	};

	const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
		const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
		if (
			(direction === 'left' && deltaX > 50) ||
			(direction === 'right' && deltaX < -50)
		) {
			onClick();
		}
	};

	return (
		<button
			className={`${styles.button} ${styles[direction]}`}
			onClick={isMobile ? undefined : onClick}
			aria-label={label}
			type="button"
			onTouchStart={isMobile ? handleTouchStart : undefined}
			onTouchEnd={isMobile ? handleTouchEnd : undefined}
		>
			<div className={styles.iconWrapper}>
				<Icon icon={icon} />
			</div>
		</button>
	);
};

export default SideRevealButton;
