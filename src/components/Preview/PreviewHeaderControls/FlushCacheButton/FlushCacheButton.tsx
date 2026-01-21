import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useQueryClient } from '@tanstack/react-query';
import styles from './FlushCacheButton.modules.scss';
import { useState, useCallback } from 'react';

type FlushCacheButtonProps = {
	isMobile?: boolean;
};

const FlushCacheButton = ({ isMobile }: FlushCacheButtonProps) => {
	const queryClient = useQueryClient();
	const [isFlushing, setIsFlushing] = useState(false);

	const handleFlush = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation();
			setIsFlushing(true);
			await queryClient.invalidateQueries();
			setTimeout(() => setIsFlushing(false), 500);
		},
		[queryClient]
	);

	const label = __('Flush Cache', 'better-preview-plugin');

	return (
		<Button
			icon="update"
			onClick={handleFlush}
			label={label}
			disabled={isFlushing}
			className={`${styles.flushButton} ${isMobile ? styles.mobile : ''}`}
		>
			{isMobile && label}
		</Button>
	);
};

export default FlushCacheButton;
