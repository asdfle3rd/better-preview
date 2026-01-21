import { useState, useMemo } from '@wordpress/element';
import { Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import AnimatedList from 'components/AnimatedList/AnimatedList';
import { usePreviewContext } from 'context/PreviewContext';

const ItemPickList = () => {
	const {
		locationHistory: history,
		previewContent,
		postData,
		dispatch,
	} = usePreviewContext();
	const currentSrc = previewContent.src;
	const postId = postData.id;

	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [anchorElement, setAnchorElement] = useState<HTMLInputElement | null>(
		null
	);

	const historyItems = [...history.getHistory()].reverse();
	// Fuzzy search
	const filteredItems = useMemo(() => {
		if (!searchQuery) {
			return historyItems;
		}
		const lowerQuery = searchQuery.toLowerCase();
		return historyItems.filter((item) =>
			item.toLowerCase().includes(lowerQuery)
		);
	}, [historyItems, searchQuery]);

	const displayUrl = currentSrc
		? `${currentSrc}${postId ? ` (ID: ${postId})` : ''}`
		: '';
	const placeholder = displayUrl || __('No URL', 'better-preview-plugin');

	return (
		<div
			id="preview-history-picker"
			style={{
				position: 'relative',
				flex: 1,
				width: 'clamp(200px, 33vw, 600px',
				padding: '0.05in',
				border: '0px solid #000',
			}}
		>
			<input
				id="history-search-input"
				ref={setAnchorElement}
				onClick={(e) => e.stopPropagation()}
				type="search"
				value={searchQuery.length ? searchQuery : ''}
				onChange={(e) => setSearchQuery(e.target.value)}
				onFocus={() => {
					setIsOpen(true);
				}}
				onBlur={() => {
					setTimeout(() => setIsOpen(false), 200);
				}}
				placeholder={placeholder}
				style={{
					border: '0',
					background: 'transparent',
					width: '100%',
					outline: 'none',
					padding: '2px',
					fontSize: '1.25em',
					color: '#1e1e1e',
					textAlign: 'left',
					textSizeAdjust: 'auto',
				}}
				aria-label={__('Search history', 'better-preview-plugin')}
			/>
			{isOpen && anchorElement && (
				<Popover
					anchor={anchorElement}
					onClose={() => setIsOpen(false)}
					focusOnMount={false}
					position="bottom center"
					className="history-popover"
					style={{
						cursor: 'pointer',
					}}
					onClick={(e) => e.stopPropagation()}
				>
					<AnimatedList
						items={filteredItems}
						displayScrollbar={false}
						showGradients={false}
						onItemClick={(item) => {
							const index = history.indexOf(item);
							if (index !== -1) {
								dispatch({
									name: 'navigateHistory',
									src: item,
									position: index,
								});
								setIsOpen(false);
							}
						}}
					/>
				</Popover>
			)}
		</div>
	);
};

export default ItemPickList;
