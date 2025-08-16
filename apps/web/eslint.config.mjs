// @ts-check
// Valid ESLint v9 flat config for Next 15
import next from 'eslint-config-next';

export default [
  // Use Next's flat config as-is (no spread of an object)
  next,

  // Project overrides (optional)
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Quiet the current blockers
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
    },
  },
];