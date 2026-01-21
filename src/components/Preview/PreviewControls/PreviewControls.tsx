import { __ } from '@wordpress/i18n';
import SwipeArea from 'components/SwipeArea/SwipeArea';
import SwipeableHeader from 'components/SwipeableHeader/SwipeableHeader';
import HistoryNavButton from 'components/Preview/PreviewHeaderControls/HistoryNavButton/HistoryNavButton';
import ItemPickList from 'components/ItemPickList/ItemPickList';
import ToggleControlsButton from 'components/Preview/PreviewHeaderControls/ToggleControlsButton/ToggleControlsButton';
import ClosePreviewButton from 'components/Preview/PreviewHeaderControls/ClosePreviewButton/ClosePreviewButton';
import PinButton from 'components/Preview/PreviewHeaderControls/PinButton/PinButton';
import StatusFilter from 'components/Preview/PreviewHeaderControls/StatusFilter/StatusFilter';
import FlushCacheButton from 'components/Preview/PreviewHeaderControls/FlushCacheButton/FlushCacheButton';
import { usePreviewContext } from 'context/PreviewContext';
import { TouchEvent, useEffect, useRef, useState } from 'react';
import PreviewOverlay from '../PreviewOverlay/PreviewOverlay';
import styles from './PreviewControls.modules.scss';
import AnimatedList from 'components/AnimatedList/AnimatedList';
import { Button } from '@wordpress/components';

const PreviewControls = () => {
	const {
		isHeaderVisible,
		setIsHeaderVisible,
		setIsHeaderPinned,
		isHeaderPinned,
		previewContent,
		locationHistory,
		dispatch,
		isMobile,
	} = usePreviewContext();

	const [headerHeight, setHeaderHeight] = useState(0);
	const [historyOpen, setHistoryOpen] = useState(false);
	const headerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (headerRef.current) {
			setHeaderHeight(headerRef.current.offsetHeight);
		}
	}, [isHeaderVisible, isHeaderPinned]);

	useEffect(() => {
		if (!headerRef.current) {
			return;
		}
		const header = headerRef.current;
		const resizeHandler = (e: Event) => {
			console.log(e.target instanceof HTMLElement, 'resizing');
			if (!(e.target instanceof HTMLElement)) {
				return;
			}
			setHeaderHeight(e.target.offsetHeight);
		};
		if (headerRef.current) {
			header.addEventListener('resize', resizeHandler);
		}

		return () => header.removeEventListener('resize', resizeHandler);
	}, [isHeaderVisible, isHeaderPinned]);

	const swipeAreaOffset =
		isHeaderVisible || isHeaderPinned ? headerHeight : 0;

	const mobileHistoryButtonLabel = historyOpen
		? __('Hide history', 'better-preview-plugin')
		: __('Show history', 'better-preview-plugin');

	const headerButtonLabel = __('Hide header', 'better-preview-plugin');

	return (
		<>
			<SwipeArea
				style={{
					transform: `translateY(${swipeAreaOffset}px) skew(-30deg)`,
					border: '2px solid #10101077',
					borderRadius: '6px',
					backgroundColor: 'white',
					backgroundBlendMode: 'revert',
				}}
			/>
			<SwipeableHeader
				ref={headerRef}
				stackedBreakpoint="1024px"
				disablePinning={isMobile}
				startContent={
					isMobile ? (
						<>
							{!historyOpen && <ClosePreviewButton isMobile />}
							<Button
								label={headerButtonLabel}
								onTouchEnd={(e: TouchEvent) => {
									e.preventDefault();
									e.stopPropagation();
									setIsHeaderVisible(false);
									setIsHeaderPinned(false);
								}}
							>
								{headerButtonLabel}
							</Button>
						</>
					) : (
						<PinButton />
					)
				}
				centerSpacing={isMobile ? '4px' : '8px'}
				centerContent={
					previewContent.src ? (
						<div className={styles.mainContainer}>
							{!isMobile ? (
								<>
									<div className={styles.navContainer}>
										<HistoryNavButton
											icon="arrow-left"
											label={__(
												'Go back',
												'better-preview-plugin'
											)}
											onClick={() =>
												locationHistory.back()
											}
										/>
										<ItemPickList />
										<HistoryNavButton
											icon="arrow-right"
											label={__(
												'Go forward',
												'better-preview-plugin'
											)}
											onClick={() =>
												locationHistory.forward()
											}
										/>
									</div>
									<StatusFilter />
								</>
							) : (
								<>
									{historyOpen && (
										<AnimatedList
											items={[
												...locationHistory.getHistory(),
											].reverse()}
											displayScrollbar={true}
											itemClassName={'text-center'}
											showGradients={false}
											onItemClick={(item) => {
												const index =
													locationHistory.indexOf(
														item
													);
												if (index !== -1) {
													dispatch({
														name: 'navigateHistory',
														src: item,
														position: index,
													});
													setHistoryOpen(false);
													setIsHeaderVisible(false);
													setIsHeaderPinned(false);
												}
											}}
										/>
									)}
								</>
							)}
						</div>
					) : null
				}
				endContent={
					!isMobile ? (
						<>
							<FlushCacheButton />
							<ToggleControlsButton />
							<ClosePreviewButton />
						</>
					) : (
						<>
							{!historyOpen && <StatusFilter />}
							<Button
								label={mobileHistoryButtonLabel}
								onTouchEnd={(e: TouchEvent) => {
									e.preventDefault();
									e.stopPropagation();
									setHistoryOpen(!historyOpen);
								}}
							>
								{mobileHistoryButtonLabel}
							</Button>
						</>
					)
				}
			/>
			<PreviewOverlay headerOffset={swipeAreaOffset} />
		</>
	);
};

export default PreviewControls;
