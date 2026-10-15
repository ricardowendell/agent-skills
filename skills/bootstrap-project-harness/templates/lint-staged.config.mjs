const config = {
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css,mjs,cjs}": ["prettier --write"]
};

export default config;
