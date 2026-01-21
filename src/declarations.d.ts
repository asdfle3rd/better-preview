declare module '*.scss' {
	const content: Record<string, string>;
	export default content;
}

declare module '*.module.scss' {
	const classes: { [key: string]: string };
	export default classes;
}

declare module '@wordpress/scripts/config/webpack.config.js';
