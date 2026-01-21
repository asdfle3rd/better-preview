import './editor.scss';
import { registerPlugin } from '@wordpress/plugins';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PreviewProvider } from 'context/PreviewContext';
import BetterPreviewContent from 'components/BetterPreviewContent/BetterPreviewContent';
import ToastProvider from 'components/Toast/ToastProvider';

const queryClient = new QueryClient();

const BetterPreview = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<ToastProvider>
				<PreviewProvider>
					<BetterPreviewContent />
				</PreviewProvider>
			</ToastProvider>
		</QueryClientProvider>
	);
};

registerPlugin('better-preview-plugin', {
	icon: 'fullscreen-alt',
	render: BetterPreview,
});
