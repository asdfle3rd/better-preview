import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

export const useUIReadyState = (SidebarPrefix: string, SidebarName: string) => {
	const [isInitialized, setIsInitialized] = useState<boolean>(false);
	const editorRef = useRef<HTMLIFrameElement | null>(null);
	const pluginButtonRef = useRef<HTMLButtonElement | null>(null);
	const pluginButtonAriaControlLable = `${SidebarPrefix}:${SidebarName}`;
	const findElementInNode = useCallback(
		(
			node: Node,
			selector: string,
			predicate?: (el: HTMLElement) => boolean
		): HTMLElement | null => {
			if (node.nodeType !== 1) {
				return null;
			}
			const element = node as HTMLElement;
			if (typeof predicate !== 'function' || predicate(element)) {
				return (
					element.querySelector(selector) ??
					(element.parentElement?.querySelector(
						selector
					) as HTMLElement)
				);
			}
			return null;
		},
		[]
	);

	const bindUI = useCallback(() => {
		// 1. Define the check function used by both initial scan and observer
		const btnSelector = `button[aria-controls="${pluginButtonAriaControlLable}"]`;
		const checkAndSetElements = (node: Node) => {
			// Check for Iframe
			if (!editorRef.current) {
				const iframe = findElementInNode(node, 'iframe', (el) =>
					el.classList.contains('block-editor-iframe__container')
				) as HTMLIFrameElement | null;
				if (iframe) {
					editorRef.current = iframe;
				}
			}

			// Check for Button
			if (!pluginButtonRef.current) {
				const btn = findElementInNode(
					node,
					btnSelector
				) as HTMLButtonElement | null;
				if (btn) {
					pluginButtonRef.current = btn;
				}
			}
		};

		// 2. Initial scan of existing DOM
		// Scan body and editor shell specifically if needed, but walking the whole DOM is expensive.
		// Targeted queries are better for initial check.
		if (!editorRef.current) {
			const container = document.querySelector(
				'.block-editor-iframe__container'
			);
			if (container) {
				const iframe = container.querySelector('iframe');
				if (iframe) {
					editorRef.current = iframe;
				}
			}
		}

		if (!pluginButtonRef.current) {
			const btn = document.querySelector(btnSelector);
			if (btn) {
				pluginButtonRef.current = btn as HTMLButtonElement;
			}
		}

		if (editorRef.current && pluginButtonRef.current) {
			setIsInitialized(true);
			return; // All good, no need to observe
		}

		// 3. Start Observer if missing elements
		const observer = new MutationObserver((mutationList, _observer) => {
			for (const mutation of mutationList) {
				if (mutation.type === 'childList') {
					mutation.addedNodes.forEach((node) => {
						checkAndSetElements(node);
					});
				}
			}

			if (editorRef.current && pluginButtonRef.current) {
				_observer.disconnect();
				setIsInitialized(true);
			}
		});

		observer.observe(document.getElementById('editor') ?? document.body, {
			childList: true,
			subtree: true,
		});

		return observer;
	}, [findElementInNode, pluginButtonAriaControlLable]);

	useEffect(() => {
		if (document.readyState === 'loading') {
			window.addEventListener('DOMContentLoaded', bindUI);
		} else {
			bindUI();
		}
		return () => {
			window.removeEventListener('DOMContentLoaded', bindUI);
		};
	}, [bindUI]);

	return {
		isInitialized,
		editorRef,
		pluginButtonRef,
	};
};
