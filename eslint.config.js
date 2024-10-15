import pluginJS from '@eslint/js';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import pluginTS from 'typescript-eslint';

export default [
  {
    ignores: [
      'node_modules',
      'dist',
      '.parcel-cache'
    ]
  },

  ... pluginTS.config(
    pluginJS.configs.recommended,
    ...pluginTS.configs.recommended,
  ),

  pluginReact.configs.flat.recommended,
  // react-hooks.  Support for eslint flat config seems to be a bit of a
  // shit-show.  It supports eslint9, but not flat config formats?  It's a bit
  // confusing and as of this writing the situation is "evolving"
  //
  // REF: https://github.com/facebook/react/issues/28313#issuecomment-2407428442
  { plugins: { pluginReactHooks } },

  {
    languageOptions: {
      globals:
 {
  ...globals.browser
      },
    },

    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'jsx-quotes': ['error', 'prefer-single'],
      'no-empty': 'off',
      'react/no-unescaped-entities': 'off',
    }
  }
];

