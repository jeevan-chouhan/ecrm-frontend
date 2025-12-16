import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import importPlugin from "eslint-plugin-import";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // Ignore build outputs
  globalIgnores(["dist", "build"]),

  {
    files: ["**/*.{js,jsx}"],

    // Base Configs
    extends: [
      js.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],

    // Environment + Language Settings

    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },

    // Plugins
    plugins: {
      react,
      import: importPlugin,
    },

    // Custom Rules (Enhanced Structure)

    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],

      // Project Structure & Imports
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always",
        },
      ],
      "import/no-duplicates": "error",
      "import/no-unresolved": "error",

      // React Best Practices
      // Warns when you use empty React fragments (<> </>) that aren’t needed
      "react/jsx-no-useless-fragment": "warn",
      // Ensures every list item has a unique key prop
      "react/jsx-key": "error",
      // Warns when a component or element has no children but isn’t self-closed
      "react/self-closing-comp": "warn",

      // Performance & Safety
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      // Ensures that all variables used inside useEffect, useCallback, or useMemo are included in the dependency array.
      "react-hooks/exhaustive-deps": "warn",

      // Core Best Practices
      // Forces use of strict comparison (=== and !==) instead of == and !=
      eqeqeq: "error",
      // Forbids use of var
      "no-var": "error",
      // If a variable is never reassigned, enforce const
      "prefer-const": "warn",

      // Code Style Rules
      // Use shorthand when the property name and variable name are the same
      "object-shorthand": "warn",
      // Disallows chaining variable assignments.
      "no-multi-assign": "error",
      "no-nested-ternary": "warn",
      // Warns if code is nested more than 4 levels deep
      "max-depth": ["warn", 4],
      // Warns when a single file exceeds 500 lines
      "max-lines": ["warn", { max: 500, skipBlankLines: true }],
      // Warns when a function takes more than 4 parameters
      "max-params": ["warn", 4],
    },
  },
]);
 