// eslint.config.js
import globals from 'globals';
import path from 'node:path';
import { defineConfig } from '@eslint/config-helpers';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import css from '@eslint/css';
import markdown from '@eslint/markdown';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsoncPlugin from 'eslint-plugin-jsonc';
import jsoncParser from 'jsonc-eslint-parser';
import unusedImports from 'eslint-plugin-unused-imports';
// import tseslint from 'typescript-eslint';

// --- Compatibility Utility ---
// This is the key to using the "old" @wordpress/eslint-plugin 
// config in the new "flat" config system.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
});

export default defineConfig([
    // 1. Global Ignores
    {
        // basePath: __dirname,
        ignores: [
            'node_modules/',
            'build/',
            'dist/',
            'vendor/',
        ],
    },
    {
        files: ['**/*.{js,mjs,cjs}'],
        plugins: { js },
        extends: ['js/recommended'],
        languageOptions: { globals: globals.browser },
    },
        // Configuration for TypeScript Files (.ts, .tsx)
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
        globals: {
            ...globals.browser, // Include browser globals (document, window, etc.)
            ...globals.node,    // Include Node.js globals (if applicable)
        },
        parser: tsParser,
        parserOptions: {
            // Essential: Tells the parser where your tsconfig is
            project: '../../../../tsconfig.json', 
            ecmaFeatures: {
                jsx: true,
            },
        },
        },
        
        // Plugins and Rules specific to TypeScript
        plugins: {
            '@typescript-eslint': tsEslint,
            'unused-imports': unusedImports,
        },
        
        // Extend recommended TypeScript rules
        rules: {
        ...tsEslint.configs.recommended.rules,
        // Custom TypeScript Overrides
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        // Enforce the use of 'type' over 'interface' where possible (preference)
        '@typescript-eslint/consistent-type-definitions': ['warn', 'type'], 
        // Prevent unused variables, excluding those starting with _
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        'unused-imports/no-unused-imports': 'error',
        },
    },
    // 3. React Configuration (for .jsx and .tsx files)
    {
        files: ['src/**/*.{js,jsx,ts,tsx}'],
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
        },
        languageOptions: {
            ...reactPlugin.configs.flat.languageOptions,
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            ...reactPlugin.configs.flat.rules,
            ...reactHooksPlugin.configs.flat.recommended.rules,
            'react/react-in-jsx-scope': 'off', // Not needed with modern React/WP
        },
    },
    // 4. WordPress Configuration (Loaded via FlatCompat)
    // This imports "plugin:@wordpress/eslint-plugin/recommended"
    ...compat.extends('plugin:@wordpress/eslint-plugin/recommended').map(config => ({
        ...config,
        // ignores: [
        //     'src/components/**'
        // ],
        files: ['src/**/*.{js,jsx,ts,tsx}'], // Apply WP rules only to src files
        languageOptions: {
            ...config.languageOptions,
            globals: {
                ...config.languageOptions?.globals,
                ...globals.browser,
                wp: 'readonly', // Add the global 'wp' object
            },
        },
    })),
    // Custom Overrides (Optional)
    {
        files: ['src/**/*.{js,jsx,ts,tsx}'],
        rules: {
        // Example: Relax a WordPress-specific rule
        '@wordpress/no-unsafe-wp-apis': 'warn',
        // Example: Enforce a custom rule
        'no-console': 'off',
        },
    },
    {
        // Apply this configuration to all JSON-like files
        files: ['**/*.jsonc', '**/*.json'],

        // 1. Register the plugin
        plugins: {
            jsonc: jsoncPlugin
        },

        // 2. Set the custom parser
        languageOptions: {
            parser: jsoncParser
        },
        // 3. Apply rules
        rules: {
            // --- Import the recommended rules from the plugin ---
            // This finds errors like duplicate keys, invalid syntax, etc.
            ...jsoncPlugin.configs['flat/recommended-with-jsonc'].rules,

            // --- Add your own formatting rules (for auto-fix) ---

            // Enforce 2-space indentation
            'jsonc/indent': ['error', 2],

            // Enforce double quotes for all strings
            'jsonc/quotes': ['error', 'double'],

            // // Enforce no trailing commas
            // 'jsonc/no-trailing-commas': 'error',

            // Enforce spacing around colons: "key": "value"
            'jsonc/key-spacing': ['error', { 'beforeColon': false, 'afterColon': true }],

            // Enforce spacing inside objects: { "key": "value" }
            'jsonc/object-curly-spacing': ['error', 'always'],

            // Enforce spacing inside arrays: ["item1", "item2"]
            'jsonc/array-bracket-spacing': ['error', 'never'],

            // Require object properties to be on a new line if the object is multiline
            'jsonc/object-property-newline': ['error', { 'allowAllPropertiesOnSameLine': true }],

            // Require array elements to be on a new line if the array is multiline
            'jsonc/array-element-newline': ['error', 'consistent']
        }
    },
    {
        files: ['**/*.json5'],
        plugins: { jsonc: jsoncPlugin },
        rules: { ...jsoncPlugin.configs['flat/recommended-with-json5'].rules },
    },
    {
        files: ['**/*.md'],
        plugins: { markdown },
        // language: 'markdown/commonmark',
        extends: ['markdown/recommended'],
    },
    {
        files: ['**/*.css'],
        plugins: { css },
        extends: ['css/recommended'],
    },
]);
