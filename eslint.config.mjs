import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable unused variables rule during development to prevent build failures
      "@typescript-eslint/no-unused-vars": "off",
      // Also disable the base no-unused-vars rule
      "no-unused-vars": "off",
      // Disable explicit any warnings (useful for rapid development)
      "@typescript-eslint/no-explicit-any": "off",
      // Disable unescaped entities (common with apostrophes and quotes in text)
      "react/no-unescaped-entities": "off",
      // Disable exhaustive deps warning for useEffect (can be noisy during development)
      "react-hooks/exhaustive-deps": "warn", // Change from error to warning
    },
  },
];

export default eslintConfig;
