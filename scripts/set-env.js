// Genera src/environments/environment.ts (no se versiona) antes de start/build/test/lint.
// - Local: sin API_URL cae al backend local (:5119). Override personal: exporta API_URL.
// - Vercel/mobile: API_URL en el dashboard, o `API_URL=<prod> pnpm build && npx cap sync`.
const fs = require('fs');
const path = require('path');

const apiUrl = process.env.API_URL || 'http://localhost:5119';
const production = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');

const content = `// Archivo autogenerado por scripts/set-env.js — no editar a mano.
export const environment = {
  production: ${production},
  apiUrl: '${apiUrl}',
};
`;

const targetPath = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');
fs.writeFileSync(targetPath, content);
console.log(`[set-env] environment.ts -> apiUrl=${apiUrl} (production=${production})`);
