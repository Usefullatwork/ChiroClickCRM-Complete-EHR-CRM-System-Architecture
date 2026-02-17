module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Error prevention
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrors: 'none',
      destructuredArrayIgnorePattern: '^_'
    }],
    'no-var': 'error',
    'prefer-const': 'error',

    // Best practices
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs'],
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    // Disabled: no-return-await is deprecated in ESLint 8.46+ and return await
    // is required inside try-catch for proper stack traces
    'no-return-await': 'off',
    // Disabled: many services are stubs/fallbacks that must maintain async
    // interfaces for API compatibility (memory-cache, vault, email, sms, etc.)
    'require-await': 'off',

    // Code quality
    'no-duplicate-imports': 'error',
    'no-template-curly-in-string': 'error',
    'prefer-template': 'error',
    'arrow-body-style': ['error', 'as-needed'],
    'no-useless-escape': 'warn',

    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error'
  }
};
