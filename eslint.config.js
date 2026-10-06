import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
    { ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...vue.configs['flat/recommended'],
    {
        files: ['**/*.vue'],
        languageOptions: {
            parserOptions: { parser: tseslint.parser },
        },
    },
    {
        files: ['packages/client/src/**'],
        languageOptions: { globals: globals.browser },
    },
    {
        files: ['packages/{server,games,protocol}/**', '*.config.{js,ts}'],
        languageOptions: { globals: globals.node },
    },
    prettier,
    {
        rules: {
            curly: 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/consistent-type-imports': 'error',
        },
    },
    {
        files: ['**/*.test.ts', '**/tests/**'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
        },
    }
);
