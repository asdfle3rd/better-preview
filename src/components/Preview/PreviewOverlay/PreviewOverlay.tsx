import { __ } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import SideRevealButton from 'components/SideRevealButton/SideRevealButton';
import { usePreviewContext } from 'context/PreviewContext';

type PreviewOverlayProps = {
	headerOffset: number;
};

const PreviewOverlay = ({ headerOffset }: PreviewOverlayProps) => {
	const {
		prevEntityIdx,
		nextEntityIdx,
		isHeaderVisible,
		previewContent,
		areOverlaysVisible,
		entityIdx,
		setEntityIdx,
		isHeaderPinned,
		currentEntity,
		isCurrentEntityRoot,
		isMobile,
	} = usePreviewContext();

	if (!areOverlaysVisible) {
		return null;
	}

	const totalEntities = previewContent.entityList.length;

	return (
		<>
			<div
				style={{
					fontSize: '1.25em',
					position: 'absolute',
					left: '50vw',
					zIndex: 2,
					transform: isCurrentEntityRoot
						? `translateX(-50%) scaleX(101) translateY(${headerOffset}px)`
						: '',
					width: isCurrentEntityRoot ? '1vw' : 0,
					padding: '0',
					height: isCurrentEntityRoot ? '0.3vh' : 0,
					background: 'green',
					transition:
						'transform 0.0s cubic-bezier(0.68, -0.55, 0.27, 1.55), 0.8s width cubic-bezier(0.68, -0.55, 0.27, 1.55), height 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
				}}
			/>
			<div
				style={{
					fontSize: '1.25em',
					position: 'absolute',
					textAlign: 'center',
					width: '100%',
					zIndex: 2,
					color: '#444',
					opacity:
						currentEntity && (isHeaderVisible || isHeaderPinned)
							? '1'
							: '0',
					height: '1.25em',
					padding: '0',
					fontFamily: 'monospace, ui-monospace',
					whiteSpace: 'nowrap',
					transform:
						isHeaderVisible || isHeaderPinned
							? `translateY(calc(100% + ${headerOffset}px))`
							: 'translateY(0)',
					transition:
						'all 400ms cubic-bezier(0.215, 0.610, 0.355, 1)',
					pointerEvents: 'none',
				}}
			>
				{currentEntity && !isCurrentEntityRoot
					? `Rev: ${currentEntity.id} | ${new Date(
							currentEntity.modified
						).toLocaleString()} (${entityIdx + 1}/${totalEntities})`
					: ''}
			</div>
			{!isNaN(prevEntityIdx) && (
				<SideRevealButton
					direction="left"
					onClick={() => setEntityIdx(prevEntityIdx)}
					icon={chevronLeft}
					label={__('Previous Entity', 'better-preview-plugin')}
					isMobile={isMobile}
				/>
			)}
			{!isNaN(nextEntityIdx) && (
				<SideRevealButton
					direction="right"
					onClick={() => setEntityIdx(nextEntityIdx)}
					icon={chevronRight}
					label={__('Next Entity', 'better-preview-plugin')}
					isMobile={isMobile}
				/>
			)}
		</>
	);
};

export default PreviewOverlay;
