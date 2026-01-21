import { useRef, useState } from '@wordpress/element';
import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react';
import { usePreviewContext } from 'context/PreviewContext';
import styles from './SwipeArea.module.scss';

type DesktopSwipeAreaProps = {
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

const DesktopSwipeArea = ({
	height = '20px',
	width = '1000px',
	style = {},
	positionX,
	setPositionX,
	dragging,
}: DesktopSwipeAreaProps) => {
	const { isHeaderVisible, setIsHeaderVisible } = usePreviewContext();
	const swipeAreaRef = useRef<HTMLDivElement>(null);
	const { isDragging, setIsDragging } = dragging;
	const hasMovedRef = useRef(false);
	const dragStartXRef = useRef(0);
	const initialLeftRef = useRef(0);
	const [isHovered, setIsHovered] = useState(false);

	const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
		if (!swipeAreaRef.current) {
			return;
		}
		// Only left click
		if (e.button !== 0) {
			return;
		}

		e.preventDefault(); // Prevent text selection
		setIsDragging(true);
		hasMovedRef.current = false;
		dragStartXRef.current = e.clientX;
		initialLeftRef.current = swipeAreaRef.current.offsetLeft;

		window.addEventListener('mousemove', handleDragMove);
		window.addEventListener('mouseup', handleDragEnd);
	};

	const handleDragMove = (e: globalThis.MouseEvent) => {
		// We can't rely on the state 'isDragging' inside this closure reliably if it wasn't a ref,
		// but since we bind/unbind, we know we are dragging if this listener is active.
		// However, to be safe and match patterns, checking the ref was convenient.
		// Since we removed the ref, we simply rely on the event listener being present.

		if (!swipeAreaRef.current) {
			return;
		}

		const deltaX = e.clientX - dragStartXRef.current;

		// Threshold for considering it a drag vs a click
		if (Math.abs(deltaX) > 5) {
			hasMovedRef.current = true;
		}

		if (hasMovedRef.current) {
			const parentWidth = window.innerWidth;
			const elementWidth = swipeAreaRef.current.offsetWidth;
			const halfWidth = elementWidth / 2;

			// Calculate new position based on initial offset + delta
			// With translateX(-50%), positionX (left) is the center point.
			let newX = initialLeftRef.current + deltaX;

			// Clamp center point within bounds
			// Left edge (newX - halfWidth) >= 0 => newX >= halfWidth
			// Right edge (newX + halfWidth) <= parentWidth => newX <= parentWidth - halfWidth
			newX = Math.max(halfWidth, Math.min(newX, parentWidth - halfWidth));

			setPositionX(`${newX}px`);
		}
	};

	const handleDragEnd = () => {
		setIsDragging(false);
		window.removeEventListener('mousemove', handleDragMove);
		window.removeEventListener('mouseup', handleDragEnd);

		if (!hasMovedRef.current) {
			setIsHeaderVisible(!isHeaderVisible);
		}
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			setIsHeaderVisible(!isHeaderVisible);
		}
	};

	const containerStyle: CSSProperties = {
		left: positionX,
		height,
		width,
		zIndex: 4,
		cursor: 'grab',
		transform: `${style.transform} translateX(-50%) ${isHovered ? 'scale(1.1)' : 'scale(1)'}`,
		...style,
	};

	return (
		<div
			ref={swipeAreaRef}
			className={`${styles.container} ${isDragging ? styles.isDragging : ''}`}
			style={containerStyle}
			role="button"
			tabIndex={0}
			aria-label="Toggle Preview Header"
			onKeyDown={handleKeyDown}
			onMouseDown={handleMouseDown}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div className={styles.line} />
		</div>
	);
};

export default DesktopSwipeArea;
