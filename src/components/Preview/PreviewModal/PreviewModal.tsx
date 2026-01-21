import { Modal } from '@wordpress/components';
import { usePreviewContext } from 'context/PreviewContext';
import { ReactNode } from 'react';

type PreviewModalProps = {
	children: ReactNode;
};

const PreviewModal = ({ children }: PreviewModalProps) => {
	const { previewActive, setPreviewActive } = usePreviewContext();

	if (!previewActive) {
		return null;
	}

	return (
		<Modal
			onRequestClose={() => setPreviewActive(false)}
			isFullScreen={true}
			shouldCloseOnEsc={true}
			__experimentalHideHeader={true}
			className="better-preview-modal"
			isDismissible={false}
		>
			{children}
		</Modal>
	);
};

export default PreviewModal;
