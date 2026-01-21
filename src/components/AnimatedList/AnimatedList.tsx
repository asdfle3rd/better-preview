import { useRef, useState, useEffect, useCallback } from '@wordpress/element';
import { motion, useInView } from 'motion/react';
import styles from './AnimatedList.modules.scss';

type AnimatedItemProps = {
	children: React.ReactNode;
	delay?: number;
	index: number;
	onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
	onClick?: React.MouseEventHandler<HTMLDivElement>;
};

const AnimatedItem: React.FC<AnimatedItemProps> = ({
	children,
	delay = 0.25,
	index,
	onMouseEnter,
	onClick,
}) => {
	const ref = useRef<HTMLDivElement>(null);
	const inView = useInView(ref, { amount: 0.5, once: false });
	return (
		<motion.div
			ref={ref}
			data-index={index}
			onMouseEnter={onMouseEnter}
			onClick={onClick}
			initial={{ scale: 0.7, opacity: 0 }}
			animate={
				inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }
			}
			transition={{ duration: 0.2, delay }}
			style={{ cursor: 'pointer' }}
		>
			{children}
		</motion.div>
	);
};

type AnimatedListProps = {
	items?: string[];
	onItemClick?: (item: string, index: number) => void;
	showGradients?: boolean;
	enableArrowNavigation?: boolean;
	className?: string;
	itemClassName?: string;
	displayScrollbar?: boolean;
	initialSelectedIndex?: number;
};

const AnimatedList: React.FC<AnimatedListProps> = ({
	items = ['No items yet'],
	onItemClick,
	showGradients = false,
	enableArrowNavigation = true,
	className = '',
	itemClassName = '',
	displayScrollbar = true,
	initialSelectedIndex = -1,
}) => {
	const listRef = useRef<HTMLDivElement>(null);
	const [selectedIndex, setSelectedIndex] =
		useState<number>(initialSelectedIndex);
	const [keyboardNav, setKeyboardNav] = useState<boolean>(false);
	const [topGradientOpacity, setTopGradientOpacity] = useState<number>(0);
	const [bottomGradientOpacity, setBottomGradientOpacity] =
		useState<number>(1);

	const handleItemMouseEnter = useCallback((index: number) => {
		setSelectedIndex(index);
	}, []);

	const handleItemClick = useCallback(
		(item: string, index: number) => {
			setSelectedIndex(index);
			if (onItemClick) {
				onItemClick(item, index);
			}
		},
		[onItemClick]
	);

	const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
		const target = e.target as HTMLDivElement;
		const { scrollTop, scrollHeight, clientHeight } = target;
		setTopGradientOpacity(Math.min(scrollTop / 50, 1));
		const bottomDistance = scrollHeight - (scrollTop + clientHeight);
		setBottomGradientOpacity(
			scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1)
		);
	}, []);

	useEffect(() => {
		if (!enableArrowNavigation) {
			return;
		}
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
				e.preventDefault();
				setKeyboardNav(true);
				setSelectedIndex((prev) =>
					Math.min(prev + 1, items.length - 1)
				);
			} else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
				e.preventDefault();
				setKeyboardNav(true);
				setSelectedIndex((prev) => Math.max(prev - 1, 0));
			} else if (e.key === 'Enter') {
				if (selectedIndex >= 0 && selectedIndex < items.length) {
					e.preventDefault();
					if (onItemClick) {
						onItemClick(items[selectedIndex], selectedIndex);
					}
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [items, selectedIndex, onItemClick, enableArrowNavigation]);

	useEffect(() => {
		if (!keyboardNav || selectedIndex < 0 || !listRef.current) {
			return;
		}
		const container = listRef.current;
		const selectedItem = container.querySelector(
			`[data-index="${selectedIndex}"]`
		) as HTMLElement | null;
		if (selectedItem) {
			const extraMargin = 50;
			const containerScrollTop = container.scrollTop;
			const containerHeight = container.clientHeight;
			const itemTop = selectedItem.offsetTop;
			const itemBottom = itemTop + selectedItem.offsetHeight;
			if (itemTop < containerScrollTop + extraMargin) {
				container.scrollTo({
					top: itemTop - extraMargin,
					behavior: 'smooth',
				});
			} else if (
				itemBottom >
				containerScrollTop + containerHeight - extraMargin
			) {
				container.scrollTo({
					top: itemBottom - containerHeight + extraMargin,
					behavior: 'smooth',
				});
			}
		}
		setKeyboardNav(false);
	}, [selectedIndex, keyboardNav]);

	return (
		<div className={`${styles.scrollListContainer} ${className}`}>
			<div
				ref={listRef}
				className={`${styles.scrollList} ${!displayScrollbar ? styles.noScrollbar : ''}`}
				onScroll={handleScroll}
			>
				{items.map((item, index) => (
					<AnimatedItem
						key={index}
						delay={0.1}
						index={index}
						onMouseEnter={() => handleItemMouseEnter(index)}
						onClick={() => handleItemClick(item, index)}
					>
						<div
							className={`${styles.item} ${selectedIndex === index ? styles.selected : ''} `}
						>
							<p
								className={`${itemClassName} ${styles.itemText}`}
							>
								{item}
							</p>
						</div>
					</AnimatedItem>
				))}
			</div>
			{showGradients && (
				<>
					<div
						className={styles.topGradient}
						style={{ opacity: topGradientOpacity }}
					></div>
					<div
						className={styles.bottomGradient}
						style={{ opacity: bottomGradientOpacity }}
					></div>
				</>
			)}
		</div>
	);
};

export default AnimatedList;
