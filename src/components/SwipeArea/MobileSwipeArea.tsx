import { useRef, useState } from '@wordpress/element';
import type { CSSProperties, TouchEvent } from 'react';
import { usePreviewContext } from 'context/PreviewContext';
import styles from './SwipeArea.module.scss';

type MobileSwipeAreaProps = {
	height?: CSSProperties['height'];
	width?: CSSProperties['width'];
	style?: CSSProperties;
	positionX: string;
	setPositionX: (x: string) => void;
	dragging: {
		isDragging: boolean;
		setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
	};
};

const MobileSwipeArea = ({
	height = '40px',
	width = '100px',
	style = {},
	positionX,
	setPositionX,
	dragging,
}: MobileSwipeAreaProps) => {
	const { setIsHeaderVisible } = usePreviewContext();
	const swipeAreaRef = useRef<HTMLDivElement>(null);
	const [isScaling, setIsScaling] = useState(false);
	const { isDragging, setIsDragging } = dragging;

	const dragStartXRef = useRef(0);
	const dragStartYRef = useRef(0);
	const initialLeftRef = useRef(0);
	const dragDirectionRef = useRef<'horizontal' | 'vertical' | null>(null);
	const holdTimerRef = useRef<number | null>(null);

	const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
		const touch = e.touches[0];
		setIsDragging(true);
		dragStartXRef.current = touch.clientX;
		dragStartYRef.current = touch.clientY;
		dragDirectionRef.current = null;

		if (swipeAreaRef.current) {
			initialLeftRef.current = swipeAreaRef.current.offsetLeft;
		}

		// Start hold timer for scaling animation
		if (holdTimerRef.current) {
			clearTimeout(holdTimerRef.current);
		}
		holdTimerRef.current = setTimeout(() => {
			setIsScaling(true);
		}, 200);

		window.addEventListener('touchmove', handleTouchMove, {
			passive: false,
		});
		window.addEventListener('touchend', handleTouchEnd);
	};

	const handleTouchMove = (e: globalThis.TouchEvent) => {
		// Rely on event listener existence for drag state check implicitly,
		// but checking the state here wouldn't be accurate if we needed immediate feedback
		// before next render. The logic below depends on refs which is fine.

		const touch = e.touches[0];
		const deltaX = touch.clientX - dragStartXRef.current;
		const deltaY = touch.clientY - dragStartYRef.current;

		if (!dragDirectionRef.current) {
			if (Math.hypot(deltaX, deltaY) > 10) {
				if (Math.abs(deltaX) > Math.abs(deltaY)) {
					dragDirectionRef.current = 'horizontal';
				} else {
					dragDirectionRef.current = 'vertical';
				}
			}
		}

		if (dragDirectionRef.current === 'horizontal' && swipeAreaRef.current) {
			// Prevent scrolling while dragging horizontally
			if (e.cancelable) {
				e.preventDefault();
			}

			const parentWidth = window.innerWidth;
			const elementWidth = swipeAreaRef.current.offsetWidth;
			const halfWidth = elementWidth / 2;

			let newX = initialLeftRef.current + deltaX;
			newX = Math.max(halfWidth, Math.min(newX, parentWidth - halfWidth));
			setPositionX(`${newX}px`);
		} else if (dragDirectionRef.current === 'vertical') {
			// If swiping down significantly
			if (deltaY > 50) {
				setIsHeaderVisible(true);
			}
		}
	};

	const handleTouchEnd = () => {
		setIsDragging(false);
		if (holdTimerRef.current) {
			clearTimeout(holdTimerRef.current);
		}
		setIsScaling(false);

		window.removeEventListener('touchmove', handleTouchMove);
		window.removeEventListener('touchend', handleTouchEnd);
	};

	const containerStyle: CSSProperties = {
		top: 0,
		left: positionX,
		height,
		width,
		zIndex: 3,
		transform: `${style.transform} translateX(-50%) ${isScaling ? 'scale(1.1)' : 'scale(1)'}`,
		...style,
	};

	return (
		<div
			ref={swipeAreaRef}
			className={`${styles.container} ${isDragging ? styles.isDragging : ''}`}
			style={containerStyle}
			role="button"
			aria-label="Swipe to toggle header"
			onTouchStart={handleTouchStart}
		>
			<div className={styles.line} />
		</div>
	);
};

export default MobileSwipeArea;
