export default [
  {
    rules: {
      "max-params": ["error", 4],
      complexity: ["error", { max: 10 }],
      "max-lines": ["warn", { max: 400, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 60, skipBlankLines: true, skipComments: true }],
    },
  },
]
