module.exports = {
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": [
    "jsdoc"
  ],
  "rules": {
    "max-lines": ["error", { "max": 80, "skipBlankLines": true, "skipComments": true }],
    "max-lines-per-function": ["error", { "max": 10, "skipBlankLines": true, "skipComments": true }],
    "complexity": ["error", 5],
    "jsdoc/require-jsdoc": "error"
  },
  "ignorePatterns": [
    "dist/",
    "node_modules/",
    "gas/Bundle_Runtime.html"
  ]
};
