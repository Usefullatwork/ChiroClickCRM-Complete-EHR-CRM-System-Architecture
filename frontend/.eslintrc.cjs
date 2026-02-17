module.exports = {
  ignorePatterns: ['dist/**', 'node_modules/**', '*.min.js'],
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
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/no-unescaped-entities': 'warn',
    'react/no-unknown-property': 'warn',

    // Error prevention
    'no-console': ['error', { allow: ['warn', 'error'] }],
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
    'no-template-curly-in-string': 'error',
    'no-useless-escape': 'warn',

    // Code quality
    'no-duplicate-imports': 'error',
    'prefer-template': 'error'
  },
  overrides: [
    {
      files: ['public/service-worker.js', 'public/sw.js'],
      env: {
        serviceworker: true
      },
      rules: {
        'no-console': 'off',
        'no-unused-vars': ['error', {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^(API_CACHE_ROUTES)$',
          caughtErrors: 'none'
        }]
      }
    },
    {
      files: ['scripts/**/*.js'],
      env: {
        node: true
      },
      rules: {
        'no-console': 'off'
      }
    },
    {
      files: [
        'src/__tests__/**',
        'src/**/*.test.js',
        'src/**/*.test.jsx',
        'src/**/*.spec.js',
        'src/**/*.spec.jsx',
        'src/test/**',
        'tests/**',
        '**/__mocks__/**',
        'vitest.config.js',
        'jest.config.js'
      ],
      env: {
        node: true,
        jest: true
      },
      globals: {
        global: 'readonly',
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        Buffer: 'readonly'
      }
    },
    {
      files: ['vite.config.js', 'tailwind.config.js'],
      env: {
        node: true
      },
      globals: {
        __dirname: 'readonly',
        require: 'readonly'
      }
    }
  ],
  settings: {
    react: {
      version: 'detect'
    }
  }
};
