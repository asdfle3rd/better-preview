import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
	useRef,
	ReactNode,
} from 'react';
import { createPortal } from '@wordpress/element';
import styles from './Toast.module.scss';

// Types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type ToastPosition =
	| 'topLeft'
	| 'topCenter'
	| 'topRight'
	| 'middleLeft'
	| 'center'
	| 'middleRight'
	| 'bottomLeft'
	| 'bottomCenter'
	| 'bottomRight';

export type ToastOptions = {
	type?: ToastType;
	duration?: number;
	position?: ToastPosition;
};

export type ToastItemProps = {
	id: number;
	message: string;
	type: ToastType;
	duration?: number;
	position?: ToastPosition;
	onRemove: (id: number) => void;
	style?: React.CSSProperties;
};

type ToastContextType = {
	addToast: (
		message: string,
		optionsOrType?: ToastOptions | ToastType,
		duration?: number
	) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error('useToast must be used within a ToastProvider');
	}
	return context;
};

const ToastItem = ({
	id,
	message,
	type,
	duration = 4000,
	onRemove,
	style,
}: ToastItemProps) => {
	const [isClosing, setIsClosing] = useState(false);
	const [isPaused, setIsPaused] = useState(false);

	// Timer Refs
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const remainingRef = useRef(duration);
	const startTimeRef = useRef(0);

	const triggerClose = useCallback(() => {
		setIsClosing(true);
		setTimeout(() => onRemove(id), 300);
	}, [id, onRemove]);

	const startTimer = useCallback(() => {
		startTimeRef.current = Date.now();
		timerRef.current = setTimeout(triggerClose, remainingRef.current);
	}, [triggerClose]);

	const pauseTimer = useCallback(() => {
		setIsPaused(true);
		if (timerRef.current) {
			clearTimeout(timerRef.current);
		}
		remainingRef.current -= Date.now() - startTimeRef.current;
	}, []);

	const resumeTimer = useCallback(() => {
		setIsPaused(false);
		startTimer();
	}, [startTimer]);

	useEffect(() => {
		startTimer();
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, [startTimer]);

	// Construct class names
	const typeStyles: Record<ToastType, string> = {
		success: styles.toastSuccess,
		error: styles.toastError,
		warning: styles.toastWarning,
		info: styles.toastInfo,
	};
	const typeClass = typeStyles[type] || styles.toastInfo;

	return (
		<div
			className={`${styles.toast} ${typeClass} ${isClosing ? styles.exiting : ''} ${isPaused ? styles.paused : ''}`}
			style={style}
			onMouseEnter={pauseTimer}
			onMouseLeave={resumeTimer}
			role="alert"
		>
			<div className={styles.toastContent}>
				<div className={styles.toastMessage}>{message}</div>
				<button
					onClick={triggerClose}
					className={styles.toastClose}
					aria-label="Close"
				>
					✕
				</button>
			</div>

			<div className={styles.toastProgressTrack}>
				<div
					className={styles.toastProgressBar}
					style={{ animationDuration: `${duration}ms` }}
				/>
			</div>
		</div>
	);
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
	const [toasts, setToasts] = useState<
		Omit<ToastItemProps, 'onRemove' | 'style'>[]
	>([]);

	const addToast = useCallback(
		(
			message: string,
			optionsOrType?: ToastOptions | ToastType,
			durationArg?: number
		) => {
			let options: ToastOptions = {};
			if (typeof optionsOrType === 'string') {
				options = { type: optionsOrType, duration: durationArg };
			} else if (optionsOrType) {
				options = optionsOrType;
			}

			const {
				type = 'info',
				duration = 4000,
				position = 'bottomRight',
			} = options;
			const id = Date.now();
			setToasts((prev) => [
				{ id, message, type, duration, position },
				...prev,
			]);
		},
		[]
	);

	const removeToast = useCallback((id: number) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	// Group toasts by position
	const toastsByPosition = toasts.reduce(
		(acc, toast) => {
			const pos = toast.position || 'bottomRight';
			if (!acc[pos]) {
				acc[pos] = [];
			}
			acc[pos].push(toast);
			return acc;
		},
		{} as Record<ToastPosition, typeof toasts>
	);

	const activePositions = Object.keys(toastsByPosition) as ToastPosition[];

	return (
		<ToastContext.Provider value={{ addToast }}>
			{children}
			{createPortal(
				<>
					{activePositions.map((position) => (
						<div
							key={position}
							className={`${styles.toastContainer} ${styles[position]}`}
						>
							{toastsByPosition[position].map((toast) => (
								<ToastItem
									key={toast.id}
									{...toast}
									onRemove={removeToast}
								/>
							))}
						</div>
					))}
				</>,
				document.body
			)}
		</ToastContext.Provider>
	);
};

export default ToastProvider;
