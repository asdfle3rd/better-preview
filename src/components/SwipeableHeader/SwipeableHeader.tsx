import { forwardRef, useRef, useState, useEffect } from '@wordpress/element';
import { type ReactNode, type CSSProperties, type TouchEvent } from 'react';
import styles from './SwipeableHeader.modules.scss';
import { usePreviewContext } from 'context/PreviewContext';

type SwipeableHeaderProps = {
	startContent?: ReactNode;
	centerContent?: ReactNode;
	endContent?: ReactNode;
	centerSpacing?: CSSProperties['gap'];
	style?: CSSProperties;
	startStyle?: CSSProperties;
	centerStyle?: CSSProperties;
	endStyle?: CSSProperties;
	onClose?: () => void;
	children?: ReactNode;
	disablePinning?: boolean;
	stackedBreakpoint?: string;
};

const SwipeableHeader = forwardRef<HTMLDivElement, SwipeableHeaderProps>(
	(
		{
			startContent,
			centerContent,
			endContent,
			centerSpacing = '1rem',
			style = {},
			startStyle = {},
			centerStyle = {},
			endStyle = {},
			onClose,
			children,
			disablePinning = false,
			stackedBreakpoint,
		},
		ref
	) => {
		const {
			previewContent,
			entityIdx,
			isHeaderVisible,
			setIsHeaderVisible,
			isHeaderPinned,
			setIsHeaderPinned,
			isMobile,
		} = usePreviewContext();
		const timeoutRef = useRef<number>(NaN);
		const touchStartRef = useRef<number>(NaN);

		const [isStacked, setIsStacked] = useState(false);

		useEffect(() => {
			if (!stackedBreakpoint) {
				return;
			}

			const mediaQuery = window.matchMedia(
				`(max-width: ${stackedBreakpoint})`
			);
			const updateStacked = (e: MediaQueryListEvent | MediaQueryList) => {
				setIsStacked(e.matches);
			};

			updateStacked(mediaQuery);
			mediaQuery.addEventListener('change', updateStacked);

			return () =>
				mediaQuery.removeEventListener('change', updateStacked);
		}, [stackedBreakpoint]);

		const handleMouseLeave = () => {
			if (!isHeaderPinned) {
				timeoutRef.current = window.setTimeout(() => {
					setIsHeaderVisible(false);
					timeoutRef.current = NaN;
				}, 1000);
				if (typeof onClose === 'function') {
					onClose();
				}
			}
		};
		const handleMouseEnter = () => {
			if (!isNaN(timeoutRef.current)) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = NaN;
			}
		};

		const handleTouchStart = (e: TouchEvent) => {
			console.log('touch start', isMobile);
			if (!isMobile) {
				return;
			}
			const touch = e.touches[0];
			touchStartRef.current = touch.clientY;
		};
		const handleTouchEnd = (e: TouchEvent) => {
			if (!isMobile) {
				return;
			}
			const touch = e.changedTouches[0];
			const dist = touchStartRef.current - touch.clientY;
			if (dist - 50 > 0) {
				setIsHeaderPinned(false);
				setIsHeaderVisible(false);
			}
		};

		const handleClick = () => {
			if (!disablePinning) {
				setIsHeaderPinned(!isHeaderPinned);
			}
		};

		const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
			if (e.key === 'Enter' || e.key === ' ') {
				handleClick();
			}
		};

		const headerClasses = [
			styles.header,
			isHeaderVisible ? styles.visible : '',
			isHeaderPinned ? styles.pinned : '',
			isStacked ? styles.stacked : '',
			previewContent.entityList[entityIdx]?.id === previewContent.rootId
				? styles['root-entity']
				: '',
		]
			.filter(Boolean)
			.join(' ');

		return (
			<div
				ref={ref}
				className={headerClasses}
				style={style}
				id="modalHeadContainer"
				role="button"
				tabIndex={0}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				onMouseLeave={handleMouseLeave}
				onMouseEnter={handleMouseEnter}
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}
				aria-label="Swipeable header with actions"
				aria-pressed={isHeaderPinned}
				title={
					isHeaderPinned
						? 'Header is pinned. Click to unpin.'
						: 'Header is not pinned. Click to pin.'
				}
			>
				<span className="screen-reader-text">
					This header can be revealed by moving your mouse to the top
					of the screen or swiping down. Click or press enter to pin
					it.
				</span>
				<div className={styles.startSection} style={startStyle}>
					<div className={styles.contentWrapper} title="">
						{startContent}
					</div>
				</div>
				<div
					className={styles.centerSection}
					style={{ gap: centerSpacing, ...centerStyle }}
				>
					<div
						className={styles.contentWrapper}
						title=""
						style={{ gap: centerSpacing }}
					>
						{centerContent}
					</div>
				</div>
				<div className={styles.endSection} style={endStyle}>
					<div className={styles.contentWrapper} title="">
						{endContent ?? children}
					</div>
				</div>
			</div>
		);
	}
);

export default SwipeableHeader;
