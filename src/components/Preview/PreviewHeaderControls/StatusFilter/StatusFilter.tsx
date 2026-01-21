import { Button } from '@wordpress/components';
import styles from './StatusFilter.module.scss';
import { usePreviewContext } from 'context/PreviewContext';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { TCoreDataSelectors, TPostData } from 'types';
import { searchItem } from 'hooks/misc/hookUtils';
import { useMemo } from 'react';

const StatusFilter = () => {
	const {
		setEntityIdx,
		entityIdx,
		previewContent,
		statusFilters,
		setStatusFilters,
		matcher,
		isMobile,
	} = usePreviewContext();
	// +++ Option, Type, Description +++
	// context, string
	//	Scope under which the request is made.
	//	Options are view, embed, and edit.
	//	Using edit typically returns more internal fields (like capabilities)."
	// exclude_from_search, boolean
	//	 Whether to filter statuses based on their searchability.
	//	Setting this to true returns only statuses that are hidden from search
	//	false returns those included in search.
	const statuses = useSelect((select) => {
		// We use the core store to fetch post statuses
		return (select(coreStore) as TCoreDataSelectors).getStatuses({
			context: 'edit',
			exclude_from_search: false,
		});
	}, []);

	const enabledStatuses = useMemo(
		() =>
			previewContent.entityList?.reduce(
				(acc: { [key: string]: boolean }, f: TPostData) => ({
					...acc,
					[f.status]: true,
				}),
				{}
			),
		[previewContent.entityList]
	);

	const toggleFilter = (status: string) => {
		const _matcher = { ...matcher };
		if ((_matcher && _matcher[status]) || statusFilters.includes(status)) {
			delete _matcher[status];
			setStatusFilters(statusFilters.filter((s: string) => s !== status));
			if (Object.keys(_matcher).length === 0 && !isNaN(entityIdx)) {
				return;
			}
		} else {
			_matcher[status] = true;
			setStatusFilters([...statusFilters, status]);
		}
		let idx = searchItem(previewContent.entityList, entityIdx, _matcher, 1);
		if (!idx) {
			idx = searchItem(
				previewContent.entityList,
				entityIdx,
				_matcher,
				-1
			);
		}
		setEntityIdx(idx);
	};

	if (!statuses) {
		return <p>Loading statuses...</p>;
	}

	const filteredStatuses = isMobile
		? statuses.filter((status) => enabledStatuses[status.slug])
		: statuses;

	return (
		<div className={styles.container}>
			{filteredStatuses.map((status) => (
				<Button
					key={status.name}
					className={`${styles.button} ${
						statusFilters.includes(status.slug) ? styles.active : ''
					}`}
					disabled={!enabledStatuses[status.slug]}
					style={{
						opacity: 1 - 0.5 * +!enabledStatuses[status.slug],
					}}
					onClick={(e: React.MouseEvent | globalThis.TouchEvent) => {
						e.stopPropagation();
						e.preventDefault();
						toggleFilter(status.slug);
					}}
				>
					{status.name.charAt(0).toUpperCase() + status.name.slice(1)}
				</Button>
			))}
		</div>
	);
};

export default StatusFilter;
