import eslintPluginAstro from "eslint-plugin-astro";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";
import markdown from "eslint-plugin-markdown";
import jsonc from "eslint-plugin-jsonc";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  // Global Ignores
  {
    ignores: ["dist/", ".astro/", "node_modules/", "public/", "**/*.d.ts"],
  },

  // Base JS/TS
  ...tseslint.configs.recommended,

  // Global Rules
  {
    rules: {
      curly: ["error", "all"],
    },
  },

  // Astro
  ...eslintPluginAstro.configs.recommended,

  // JSON
  ...jsonc.configs["flat/recommended-with-jsonc"],

  // Markdown
  ...markdown.configs.recommended,

  // React
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": hooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off", // Not needed in modern React/Astro
      "react/prop-types": "off", // TypeScript handles this
    },
    settings: {
      react: { version: "detect" },
    },
  },

  // Unused Imports
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },

  // Prettier Plugin (Enforce formatting as ESLint rules)
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },

  // Markdown Code Blocks Overrides
  {
    files: ["**/*.md/**"],
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "react-hooks/rules-of-hooks": "off",
      "unused-imports/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "off",
    },
  },

  // Prettier Config (Must be last to override other formatting rules)
  prettierConfig,
];

