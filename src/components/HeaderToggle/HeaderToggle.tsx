import { __ } from '@wordpress/i18n';
import { PluginMoreMenuItem } from '@wordpress/edit-post';
import { cog } from '@wordpress/icons';
import { usePreviewContext } from 'context/PreviewContext';

const HeaderToggle = () => {
	const { previewActive, setPreviewActive } = usePreviewContext();

	return (
		<PluginMoreMenuItem
			icon={cog}
			onClick={() => setPreviewActive(!previewActive)}
		>
			{previewActive
				? __('Disable Preview', 'better-preview-plugin')
				: __('Enable Preview', 'better-preview-plugin')}
		</PluginMoreMenuItem>
	);
};

export default HeaderToggle;
