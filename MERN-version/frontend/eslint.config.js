export default [
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        alert: 'readonly',
        fetch: 'readonly',
        Blob: 'readonly',
        CustomEvent: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        
        // Node globals
        process: 'readonly',
        require: 'readonly',
        
        // Test globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        
        // React Testing Library globals
        render: 'readonly',
        screen: 'readonly',
        fireEvent: 'readonly',
        waitFor: 'readonly',
        queries: 'readonly',
        mutations: 'readonly',
        
        // Other globals
        target: 'readonly',
        pagination: 'readonly',
        params: 'readonly',
        any: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off', // Allow console statements in this project
      'prefer-const': 'error',
      'no-var': 'error',
      'no-undef': 'error',
    },
  },
  {
    ignores: ['node_modules/', 'dist/', 'build/', '*.min.js'],
  },
];
