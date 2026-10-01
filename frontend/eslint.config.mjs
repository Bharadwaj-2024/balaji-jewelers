import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  {
    // Data hydration and API loading are intentionally initiated from effects.
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },
  globalIgnores(['.next/**', 'node_modules/**']),
]);
