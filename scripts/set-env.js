// Genera src/environments/environment.ts a partir de variables de entorno
// antes del build/serve. En Vercel, configura API_URL en el dashboard del
// proyecto. En local, si no está seteada, cae al backend de desarrollo.
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
