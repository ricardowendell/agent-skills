import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // AI-focused limits
      "max-params": ["error", 4],
      complexity: ["error", { max: 10 }],
      "max-lines": ["warn", { max: 200, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 60, skipBlankLines: true, skipComments: true }],
    },
  }
);
