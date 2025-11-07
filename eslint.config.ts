import { defineConfig } from 'eslint-config-hyoban'

const hyobanConfig = await defineConfig(
  {
    formatting: false, // Use Prettier for formatting
    lessOpinionated: true,
    preferESM: true, // Next.js uses ESM
    react: true,
    tailwindCSS: true,
  },

  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },

    // TailwindCSS v4 usually has no config file. Silence the plugin's
    // config resolution warning by explicitly disabling auto-resolution.
    settings: {
      tailwindcss: {
        // ESLint plugin will not attempt to resolve tailwind config
        // which avoids repeated "Cannot resolve default tailwindcss config path" warnings.
        config: false,
      },
    },

    rules: {
      // TypeScript
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',

      // Unicorn
      'unicorn/prefer-math-trunc': 'off',
      'unicorn/no-static-only-class': 'off',
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/no-document-cookie': 'off', // Disable due to toReversed() compatibility issue

      // React
      '@eslint-react/no-clone-element': 'off',
      '@eslint-react/hooks-extra/no-direct-set-state-in-use-effect': 'off',

      // TailwindCSS v4 not support custom classname detection
      'tailwindcss/no-custom-classname': 'off',

      // General
      'no-restricted-syntax': 'off',

      // Disable React Compiler rules (not using React 19 compiler yet)
      'react-compiler/react-compiler': 'off',
    },
  },

  // Disable type checking for config files
  {
    files: ['*.config.js', '*.config.mjs', '*.config.ts'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
  },

  {
    files: ['**/*.tsx'],
    rules: {
      '@stylistic/jsx-self-closing-comp': 'error',
    },
  },

  // Ignore build outputs and generated files
  {
    ignores: [
      'dist/**',
      'build/**',
      '.next/**',
      'out/**',
      'node_modules/**',
      'drizzle/**',
      'public/**',
      '.turbo/**',
      '.contentlayer/**',
    ],
  },
)

export default hyobanConfig
