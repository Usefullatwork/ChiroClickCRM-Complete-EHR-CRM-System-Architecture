export default {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['react', 'react-hooks'],
  rules: {
    // React specific
    'react/react-in-jsx-scope': 'off',  // Not needed in React 17+
    'react/prop-types': 'off',  // Using TypeScript or runtime validation
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Error prevention
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-var': 'error',
    'prefer-const': 'error',

    // Best practices
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-template-curly-in-string': 'error',

    // Code quality
    'no-duplicate-imports': 'error',
    'prefer-template': 'error'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
