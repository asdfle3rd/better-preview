import { useEffect, useRef } from '@wordpress/element';
import { useState, type CSSProperties } from 'react';
import useLocalStorage from 'hooks/useLocalStorage';
import { usePreviewContext } from 'context/PreviewContext';
import DesktopSwipeArea from './DesktopSwipeArea';
import MobileSwipeArea from './MobileSwipeArea';
import styles from './SwipeArea.module.scss';

type SwipeAreaProps = {
	height?: CSSProperties['height'];
	width?: CSSProperties['width'];
	style?: CSSProperties;
};

const SwipeArea = ({
	height = '10px',
	width = '100px',
	style = {},
}: SwipeAreaProps) => {
	const [positionX, setPositionX] = useLocalStorage(
		'swipeAreaPositionX',
		'50%'
	);
	const { isMobile } = usePreviewContext();
	const [isDragging, setIsDragging] = useState<boolean>(false);

	// Ref to keep track of positionX for the resize listener without re-binding
	const positionXRef = useRef(positionX);

	useEffect(() => {
		positionXRef.current = positionX;
	}, [positionX]);

	useEffect(() => {
		const handleResize = () => {
			const currentPos = positionXRef.current;
			if (
				currentPos &&
				typeof currentPos === 'string' &&
				currentPos.endsWith('px')
			) {
				const pxVal = parseFloat(currentPos);
				let widthVal = 100;
				if (typeof width === 'string' && width.endsWith('px')) {
					widthVal = parseFloat(width);
				} else if (typeof width === 'number') {
					widthVal = width;
				}

				const max = window.innerWidth - widthVal;
				if (pxVal > max) {
					// Clamp
					setPositionX(`${Math.max(0, max)}px`);
				}
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [width, setPositionX]);

	// Props to pass down
	const commonProps = {
		height,
		width,
		style,
		positionX: positionX || '50%', // Handle undefined case from useLocalStorage
		setPositionX: (val: string) => setPositionX(val), // wrapper
		dragging: { isDragging, setIsDragging },
	};

	return (
		<>
			{isDragging && <div className={`${styles['swipe-helper']}`} />}
			{(isMobile && <MobileSwipeArea {...commonProps} />) || (
				<DesktopSwipeArea {...commonProps} />
			)}
		</>
	);
};

export default SwipeArea;
