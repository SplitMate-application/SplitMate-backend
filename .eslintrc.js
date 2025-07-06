module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ["airbnb-base"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    // Indentation
    indent: ["error", 2],

    // Line endings
    "linebreak-style": ["error", "unix"],

    // Quotes
    quotes: ["error", "single"],
    "jsx-quotes": ["error", "prefer-double"],

    // Semicolons
    semi: ["error", "always"],

    // Trailing commas
    "comma-dangle": ["error", "always-multiline"],

    // Max line length
    "max-len": ["error", { code: 120 }],

    // Console statements (allow in development)
    "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",

    // Unused variables
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],

    // Prefer const over let
    "prefer-const": "error",

    // No var
    "no-var": "error",

    // Object shorthand
    "object-shorthand": "error",

    // Arrow function parentheses
    "arrow-parens": ["error", "always"],

    // Function parentheses
    "space-before-function-paren": ["error", "always"],

    // Object curly spacing
    "object-curly-spacing": ["error", "always"],

    // Array bracket spacing
    "array-bracket-spacing": ["error", "never"],

    // Comma spacing
    "comma-spacing": ["error", { before: false, after: true }],

    // Key spacing
    "key-spacing": ["error", { beforeColon: false, afterColon: true }],

    // No multiple empty lines
    "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1 }],

    // EOL
    "eol-last": ["error", "always"],

    // Import/Export rules
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
        "newlines-between": "always",
      },
    ],

    "import/no-unresolved": "off", // Allow unresolved imports for now
    "import/extensions": "off", // Allow extensions in imports

    // Security rules
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-script-url": "error",

    // Node.js specific rules
    "global-require": "off", // Allow require in any scope
    "no-process-exit": "error",

    // Express specific rules
    "no-param-reassign": ["error", { props: false }], // Allow req.body = value

    // Async/await rules
    "no-return-await": "error",
    "require-await": "error",

    // Error handling
    "no-throw-literal": "error",

    // Performance
    "no-loop-func": "error",
    "no-new-object": "error",
    "no-new-array": "error",
    "no-new-wrappers": "error",

    // Code quality
    eqeqeq: ["error", "always"],
    curly: ["error", "all"],
    "brace-style": ["error", "1tbs"],
    "space-before-blocks": "error",
    "keyword-spacing": "error",
    "space-infix-ops": "error",
    "space-unary-ops": "error",
    "spaced-comment": ["error", "always"],

    // File naming
    camelcase: ["error", { properties: "never" }],

    // JSDoc (optional)
    "valid-jsdoc": "off",
    "require-jsdoc": "off",
  },
  overrides: [
    {
      files: ["*.test.js", "*.spec.js"],
      env: {
        jest: true,
      },
      rules: {
        "no-unused-expressions": "off",
      },
    },
  ],
};
