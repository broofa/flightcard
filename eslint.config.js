export default {
  root: true,
  env: {
    node: true,
    browser: true
  },

  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    "plugin:react-hooks/recommended"
  ],
  rules: {
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    'jsx-quotes': ['error', 'prefer-single'],
    'no-empty': 'off',
    'react/no-unescaped-entities': 'off',
  }
};

