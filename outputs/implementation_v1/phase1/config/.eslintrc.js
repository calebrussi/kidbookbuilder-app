module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './phases/phase1/config/tsconfig.json',
    tsconfigRootDir: process.cwd(),
  },
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'import', 'prettier'],
  rules: {
    'prettier/prettier': ['error', { 
      'singleQuote': true,
      'semi': true,
      'tabWidth': 2,
      'printWidth': 100,
      'trailingComma': 'es5',
      'bracketSpacing': true,
      'arrowParens': 'avoid',
      'endOfLine': 'lf'
    }],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'import/no-unresolved': 'error'
  },
  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'coverage/'],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './phases/phase1/config/tsconfig.json',
      }
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx']
    }
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      rules: {
        // TypeScript-specific rules here
      }
    }
  ]
}; 