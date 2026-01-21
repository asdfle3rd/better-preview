/* eslint-disable */
import defaultConfig from '@wordpress/scripts/config/webpack.config.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
	...defaultConfig,
	resolve: {
		...defaultConfig.resolve,
		modules: [path.resolve(__dirname, 'src'), 'node_modules'],
	},
};
